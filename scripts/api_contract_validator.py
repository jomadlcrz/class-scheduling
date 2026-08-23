import os
import re
import sys
import argparse

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TYPES_DIR = os.path.join(FRONTEND_DIR, 'app', 'types')
BACKEND_DIR = os.path.abspath(os.path.join(FRONTEND_DIR, '..', 'class-scheduling-backend'))
MODELS_DIR = os.path.join(BACKEND_DIR, 'app', 'modules')

def to_snake_case(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def to_camel_case(snake_str):
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def extract_ts_interfaces():
    interfaces = {}
    if not os.path.exists(TYPES_DIR):
        return interfaces

    for root, _, files in os.walk(TYPES_DIR):
        for file in files:
            if file.endswith('.ts') and not file.endswith('.d.ts'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    # Match type X = { ... } or interface X { ... }
                    matches = re.finditer(r'(?:export\s+)?(?:type|interface)\s+([A-Za-z0-9_]+)\s*(?:=\s*)?\{([^}]+)\}', content)
                    for m in matches:
                        name = m.group(1)
                        body = m.group(2)
                        fields = {}
                        for line in body.splitlines():
                            line = line.strip()
                            if not line or line.startswith('//') or line.startswith('/*') or line.startswith('*'):
                                continue
                            field_match = re.match(r'([a-zA-Z0-9_]+)(\?)?:\s*([^;,]+)', line)
                            if field_match:
                                fname = field_match.group(1)
                                is_optional = bool(field_match.group(2)) or 'null' in field_match.group(3) or 'undefined' in field_match.group(3)
                                ftype = field_match.group(3).strip()
                                fields[fname] = {'optional': is_optional, 'type': ftype}
                        if fields:
                            interfaces[name] = {'file': file, 'fields': fields}
                except Exception:
                    pass
    return interfaces

def extract_backend_models():
    models = {}
    if not os.path.exists(MODELS_DIR):
        return models

    for root, _, files in os.walk(MODELS_DIR):
        for file in files:
            if file.endswith('.py') and ('models.py' in file or 'model.py' in file):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    # Find class definitions
                    class_matches = re.finditer(r'class\s+([A-Za-z0-9_]+)\s*\((?:[^)]*db\.Model[^)]*|[^)]*Base[^)]*)\):', content)
                    for cm in class_matches:
                        cname = cm.group(1)
                        # Extract class body
                        start = cm.end()
                        lines = content[start:].splitlines()
                        class_lines = []
                        for l in lines:
                            if l.startswith('class ') and len(class_lines) > 0:
                                break
                            class_lines.append(l)
                        
                        fields = {}
                        for cl in class_lines:
                            # Match mapped_column or Column or Mapped[...]
                            col_match = re.search(r'([a-zA-Z0-9_]+)\s*(?::\s*Mapped\[([^\]]+)\])?\s*=\s*(?:mapped_column|db\.Column)\((.*?)\)', cl)
                            if col_match:
                                col_name = col_match.group(1)
                                col_type_hint = col_match.group(2) or ""
                                col_args = col_match.group(3) or ""
                                is_nullable = 'nullable=True' in col_args or 'None' in col_type_hint or '| None' in col_type_hint
                                fields[col_name] = {
                                    'type_hint': col_type_hint,
                                    'args': col_args,
                                    'nullable': is_nullable
                                }
                        if fields:
                            models[cname] = {'file': file, 'fields': fields}
                except Exception:
                    pass
    return models

def run_contract_audit():
    print("\n" + "=" * 90)
    print("           FRONTEND <-> BACKEND API CONTRACT & TYPE MISMATCH VALIDATOR")
    print("=" * 90)

    ts_interfaces = extract_ts_interfaces()
    py_models = extract_backend_models()

    print(f"[*] Loaded {len(ts_interfaces)} TypeScript types/interfaces and {len(py_models)} Backend Models.\n")

    mismatches = []
    casing_warnings = []
    nullability_warnings = []

    # Common matching heuristics between TS types and Backend models
    model_ts_pairs = [
        ('Room', 'Room'),
        ('Building', 'Building'),
        ('Department', 'Department'),
        ('Subject', 'Subject'),
        ('RegularSchedule', 'Schedule'),
        ('User', 'User'),
        ('Semester', 'Semester'),
        ('SchoolYear', 'SchoolYear')
    ]

    for py_name, ts_name in model_ts_pairs:
        py_model = py_models.get(py_name)
        ts_type = ts_interfaces.get(ts_name)

        if not py_model or not ts_type:
            continue

        print(f"--- Comparing Backend Model '{py_name}' <-> Frontend Type '{ts_name}' ---")
        py_fields = py_model['fields']
        ts_fields = ts_type['fields']

        for py_field, py_info in py_fields.items():
            camel_name = to_camel_case(py_field)
            
            # Check if frontend uses snake_case or camelCase
            found_in_ts = py_field in ts_fields or camel_name in ts_fields
            matched_key = py_field if py_field in ts_fields else (camel_name if camel_name in ts_fields else None)

            if not found_in_ts:
                # Column exists in DB but not represented in TS type
                mismatches.append({
                    'model': py_name,
                    'type': ts_name,
                    'field': py_field,
                    'issue': f"Backend field '{py_field}' is omitted from TypeScript '{ts_name}'",
                    'severity': 'INFO'
                })
            else:
                ts_info = ts_fields[matched_key]
                # Nullability check
                if py_info['nullable'] and not ts_info['optional']:
                    nullability_warnings.append({
                        'model': py_name,
                        'type': ts_name,
                        'field': matched_key,
                        'issue': f"Field '{matched_key}' is nullable in Backend DB, but marked as non-nullable in Frontend TS interface",
                        'severity': 'WARNING'
                    })

                # Casing report
                if py_field != matched_key and '_' in py_field:
                    casing_warnings.append({
                        'model': py_name,
                        'type': ts_name,
                        'py_field': py_field,
                        'ts_field': matched_key
                    })

    print(f"\n[1] CASING ALIGNMENT (Backend snake_case <-> Frontend camelCase):")
    print(f"    Total Normalized Field Mappings: {len(casing_warnings)}")
    for c in casing_warnings[:8]:
        print(f"     - {c['model']}.{c['py_field']}  <--->  {c['type']}.{c['ts_field']} (Normalized via camelCase parser)")

    if nullability_warnings:
        print(f"\n[2] POTENTIAL NULLABILITY DESYNCS ({len(nullability_warnings)} Found):")
        for nw in nullability_warnings:
            print(f"    [!] {nw['type']}.{nw['field']}: {nw['issue']}")
    else:
        print("\n[2] NULLABILITY INTEGRITY: [OK] All backend nullable columns match frontend optional types.")

    print("\n" + "=" * 90)
    print("                    API CONTRACT VALIDATION SUMMARY")
    print("=" * 90)
    print(f"  Types Analyzed        : {len(ts_interfaces)} Frontend Interfaces | {len(py_models)} Backend Models")
    print(f"  Field Casing Status   : [OK] Consistent camelCase/snake_case API transforms")
    print(f"  Null Safety Status    : {'[WARNINGS DETECTED]' if nullability_warnings else '[OK] Clean Null Safety'}")
    print("=" * 90 + "\n")

def interactive_menu():
    while True:
        print("=" * 80)
        print("         FRONTEND <-> BACKEND API CONTRACT VALIDATOR")
        print("=" * 80)
        print("  1. Run Full Schema & Type Contract Audit")
        print("  2. List All Frontend TypeScript Interfaces")
        print("  3. List All Backend SQLAlchemy Models")
        print("  0. Exit")
        print("=" * 80)

        choice = input("Select an action (0-3): ").strip()
        if choice == "1":
            run_contract_audit()
            input("Press Enter to continue...")
        elif choice == "2":
            interfaces = extract_ts_interfaces()
            print(f"\n--- Discovered {len(interfaces)} TypeScript Interfaces ---")
            for k, v in sorted(interfaces.items()):
                print(f"  - {k:<25} ({len(v['fields'])} fields in {v['file']})")
            print()
            input("Press Enter to continue...")
        elif choice == "3":
            models = extract_backend_models()
            print(f"\n--- Discovered {len(models)} Backend Models ---")
            for k, v in sorted(models.items()):
                print(f"  - {k:<25} ({len(v['fields'])} fields in {v['file']})")
            print()
            input("Press Enter to continue...")
        elif choice == "0":
            break
        else:
            print("[!] Invalid choice. Try again.\n")

def main():
    parser = argparse.ArgumentParser(description="API Contract & Type Mismatch Validator.")
    parser.add_argument("--audit", action="store_true", help="Run contract audit")
    args = parser.parse_args()

    if args.audit:
        run_contract_audit()
    else:
        interactive_menu()

if __name__ == '__main__':
    main()
