import { useEffect } from "react";

let lockCount = 0;
let savedScrollY = 0;
let savedBodyPosition = "";
let savedBodyTop = "";
let savedBodyWidth = "";
let savedBodyPaddingRight = "";

function acquire() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    savedBodyPosition = document.body.style.position;
    savedBodyTop = document.body.style.top;
    savedBodyWidth = document.body.style.width;
    savedBodyPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const bodyPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;

    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = "100%";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
    }
  }
  lockCount++;
}

function release() {
  lockCount--;
  if (lockCount <= 0) {
    lockCount = 0;
    document.body.style.position = savedBodyPosition;
    document.body.style.top = savedBodyTop;
    document.body.style.width = savedBodyWidth;
    document.body.style.paddingRight = savedBodyPaddingRight;
    window.scrollTo(0, savedScrollY);
  }
}

export function useScrollLock() {
  useEffect(() => {
    acquire();
    return () => release();
  }, []);
}
