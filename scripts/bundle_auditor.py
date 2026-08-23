import os
import re
import sys
import gzip
import json
import subprocess
import argparse

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
APP_DIR = os.path.join(FRONTEND_DIR, 'app')
BUILD_DIR = os.path.join(FRONTEND_DIR, 'build')
CLIENT_ASSETS_DIR = os.path.join(BUILD_DIR, 'client', 'assets')

def format_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def get_gzip_size(filepath):
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
        return len(gzip.compress(data))
    except Exception:
        return 0

def audit_bundle_chunks():
    print("\n" + "=" * 90)
    print("                      FRONTEND PRODUCTION BUNDLE CHUNKS")
    print("=" * 90)

    if not os.path.exists(CLIENT_ASSETS_DIR):
        print(f"[!] No build output found in {CLIENT_ASSETS_DIR}")
        print("    Running 'npm run build' first to generate production assets...")
        run_build()
        if not os.path.exists(CLIENT_ASSETS_DIR):
            print("[ERROR] Build failed or output folder not found.")
            return

    js_files = []
    css_files = []
    other_files = []

    for root, _, files in os.walk(CLIENT_ASSETS_DIR):
        for f in files:
            path = os.path.join(root, f)
            size = os.path.getsize(path)
            gz_size = get_gzip_size(path)
            item = {'name': f, 'path': path, 'size': size, 'gz_size': gz_size}
            if f.endswith('.js'):
                js_files.append(item)
            elif f.endswith('.css'):
                css_files.append(item)
            else:
                other_files.append(item)

    js_files.sort(key=lambda x: x['size'], reverse=True)
    css_files.sort(key=lambda x: x['size'], reverse=True)

    print(f"\n{'CHUNK NAME':<45} {'RAW SIZE':<15} {'GZIP SIZE':<15} {'STATUS':<12}")
    print("-" * 90)

    total_raw = 0
    total_gz = 0

    print(" [ JavaScript Chunks ]")
    for item in js_files:
        total_raw += item['size']
        total_gz += item['gz_size']
        status = "OPTIMAL"
        if item['size'] > 500 * 1024:
            status = "WARNING (>500K)"
        elif item['size'] > 300 * 1024:
            status = "MODERATE"
        display_name = item['name']
        if len(display_name) > 42:
            display_name = display_name[:40] + ".."
        print(f"   {display_name:<42} {format_size(item['size']):<15} {format_size(item['gz_size']):<15} {status:<12}")

    print("\n [ CSS Bundles ]")
    for item in css_files:
        total_raw += item['size']
        total_gz += item['gz_size']
        display_name = item['name']
        if len(display_name) > 42:
            display_name = display_name[:40] + ".."
        print(f"   {display_name:<42} {format_size(item['size']):<15} {format_size(item['gz_size']):<15} OPTIMAL")

    print("-" * 90)
    print(f"  TOTAL ASSET FOOTPRINT: {format_size(total_raw)} (Raw) | {format_size(total_gz)} (Gzipped)")
    print("=" * 90 + "\n")

def scan_dead_code():
    print("\n" + "=" * 90)
    print("                   DEAD CODE & ORPHANED FILE SCANNER")
    print("=" * 90)

    all_files = []
    for root, _, files in os.walk(APP_DIR):
        for f in files:
            if f.endswith(('.tsx', '.ts')) and not f.endswith('.d.ts'):
                rel_path = os.path.relpath(os.path.join(root, f), APP_DIR).replace('\\', '/')
                all_files.append(rel_path)

    # Routes and root entry points are always active entrypoints
    entrypoints = {
        'root.tsx',
        'routes.ts',
        'entry.client.tsx',
        'entry.server.tsx'
    }

    # Collect all import and dynamic import statements across the entire codebase
    import_references = set()
    import_regex = re.compile(r"""(?:from|import)\s+['"]([^'"]+)['"]|(?:import\s*\(\s*['"]([^'"]+)['"]\s*\))""")

    for rel_file in all_files:
        full_path = os.path.join(APP_DIR, rel_file)
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
                matches = import_regex.findall(content)
                for m1, m2 in matches:
                    ref = m1 or m2
                    import_references.add(ref)
        except Exception:
            pass

    # Normalized check
    orphans = []
    for rel_file in all_files:
        # Check if file is in routes/ - route modules are loaded by React Router's route configuration
        if rel_file.startswith('routes/'):
            continue
        if rel_file in entrypoints:
            continue

        base_name = os.path.splitext(os.path.basename(rel_file))[0]
        # Check if referenced via alias ~/path or relative ./path or direct name
        is_referenced = False
        for ref in import_references:
            if ref.endswith(base_name) or rel_file.replace('.tsx', '').replace('.ts', '') in ref:
                is_referenced = True
                break

        if not is_referenced:
            # Deep check for partial matches or barrel file exports
            dir_name = os.path.dirname(rel_file)
            for ref in import_references:
                if base_name in ref or (dir_name and dir_name in ref):
                    is_referenced = True
                    break

        if not is_referenced:
            orphans.append(rel_file)

    if orphans:
        print(f"\n[!] Found {len(orphans)} potentially unreferenced / dead component files:")
        for o in orphans:
            file_size = os.path.getsize(os.path.join(APP_DIR, o))
            print(f"  - app/{o} ({format_size(file_size)})")
        print("\n  Note: Verify dynamic imports before deleting any file.")
    else:
        print("\n[OK] Clean architecture! Zero unreferenced / dead component files detected in app/.")

    print("=" * 90 + "\n")

def analyze_dependencies():
    print("\n" + "=" * 90)
    print("                     DEPENDENCY FOOTPRINT & WEIGHT")
    print("=" * 90)

    pkg_path = os.path.join(FRONTEND_DIR, 'package.json')
    if not os.path.exists(pkg_path):
        print("[ERROR] package.json not found.")
        return

    with open(pkg_path, 'r', encoding='utf-8') as f:
        pkg = json.load(f)

    deps = pkg.get('dependencies', {})
    dev_deps = pkg.get('devDependencies', {})

    node_modules = os.path.join(FRONTEND_DIR, 'node_modules')
    dep_sizes = []

    if os.path.exists(node_modules):
        for dep in deps.keys():
            dep_path = os.path.join(node_modules, dep)
            size = 0
            if os.path.exists(dep_path):
                for root, _, files in os.walk(dep_path):
                    for file in files:
                        size += os.path.getsize(os.path.join(root, file))
            dep_sizes.append((dep, deps[dep], size))

    dep_sizes.sort(key=lambda x: x[2], reverse=True)

    print(f"\n{'PACKAGE NAME':<35} {'VERSION':<15} {'ON-DISK SIZE':<15} {'IMPACT'}")
    print("-" * 90)

    for dep, ver, size in dep_sizes:
        impact = "LIGHT"
        if size > 10 * 1024 * 1024:
            impact = "HEAVY"
        elif size > 2 * 1024 * 1024:
            impact = "MODERATE"
        print(f"  {dep:<35} {ver:<15} {format_size(size):<15} {impact}")

    print("-" * 90)
    print(f"  Total Production Dependencies: {len(deps)}")
    print(f"  Total Dev Dependencies       : {len(dev_deps)}")
    print("=" * 90 + "\n")

def run_build():
    print("\n[*] Triggering fresh production build (react-router build)...")
    cmd = "npm.cmd run build" if sys.platform == "win32" else "npm run build"
    result = subprocess.run(cmd, cwd=FRONTEND_DIR, shell=True)
    if result.returncode == 0:
        print("[OK] Build completed successfully.")
    else:
        print(f"[!] Build failed with exit code {result.returncode}.")

def interactive_menu():
    while True:
        print("=" * 80)
        print("             FRONTEND BUNDLE SIZE & DEAD CODE AUDITOR")
        print("=" * 80)
        print("  1. Audit Production Bundle Chunks & Gzip Sizes")
        print("  2. Scan for Dead Code & Unreferenced Components")
        print("  3. Run Fresh Production Build & Full Analysis")
        print("  4. Dependency Weight & node_modules Footprint")
        print("  0. Exit")
        print("=" * 80)

        choice = input("Select an action (0-4): ").strip()

        if choice == "1":
            audit_bundle_chunks()
            input("Press Enter to continue...")
        elif choice == "2":
            scan_dead_code()
            input("Press Enter to continue...")
        elif choice == "3":
            run_build()
            audit_bundle_chunks()
            scan_dead_code()
            input("Press Enter to continue...")
        elif choice == "4":
            analyze_dependencies()
            input("Press Enter to continue...")
        elif choice == "0":
            break
        else:
            print("[!] Invalid choice. Try again.\n")

def main():
    parser = argparse.ArgumentParser(description="Frontend Bundle & Dead Code Auditor.")
    parser.add_argument("--audit", action="store_true", help="Audit bundle chunks")
    parser.add_argument("--dead-code", action="store_true", help="Scan for dead code")
    parser.add_argument("--deps", action="store_true", help="Analyze dependencies")
    parser.add_argument("--build", action="store_true", help="Run build and full audit")
    args = parser.parse_args()

    if args.build:
        run_build()
        audit_bundle_chunks()
        scan_dead_code()
    elif args.audit:
        audit_bundle_chunks()
    elif args.dead_code:
        scan_dead_code()
    elif args.deps:
        analyze_dependencies()
    else:
        interactive_menu()

if __name__ == "__main__":
    main()
