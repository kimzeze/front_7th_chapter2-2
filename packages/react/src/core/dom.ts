/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Instance } from "./types";

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  // children은 별도 처리
  for (const [key, value] of Object.entries(props)) {
    if (key === "children") {
      continue;
    }

    // 1. 이벤트 핸들러 (onClick, onChange 등) on으로 시작하는 속성
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase(); // onClick → click
      dom.addEventListener(eventType, value);
      continue;
    }

    // 2. className
    if (key === "className") {
      dom.className = value || "";
      continue;
    }

    // 3. style 객체
    if (key === "style" && typeof value === "object" && value !== null) {
      for (const [styleKey, styleValue] of Object.entries(value)) {
        (dom.style as any)[styleKey] = styleValue;
      }
      continue;
    }

    // 4. 일반 속성
    if (value != null) {
      dom.setAttribute(key, String(value));
    }
  }
};

/**
 * 이전 속성과 새로운 속성을 비교하여 DOM 요소의 속성을 업데이트합니다.
 * 변경된 속성만 효율적으로 DOM에 반영해야 합니다.
 */
export const updateDomProps = (
  dom: HTMLElement,
  prevProps: Record<string, any> = {},
  nextProps: Record<string, any> = {},
): void => {
  // 1. 이전 props 제거
  for (const [key, value] of Object.entries(prevProps)) {
    if (key === "children") {
      continue;
    }

    // nextProps에 없는 속성 제거
    if (!(key in nextProps)) {
      if (key.startsWith("on")) {
        // 이벤트 핸들러 제거
        const eventType = key.slice(2).toLowerCase();
        dom.removeEventListener(eventType, value);
      } else if (key === "className") {
        // className 제거
        dom.className = "";
      } else if (key === "style") {
        // style 제거
        dom.style.cssText = "";
      } else {
        // 일반 속성 제거
        dom.removeAttribute(key);
      }
    }
  }

  // 2. 새 props 적용
  for (const [key, value] of Object.entries(nextProps)) {
    if (key === "children") {
      continue;
    }

    const prevValue = prevProps[key];

    // 값이 같으면 건너뛰기 (최적화)
    if (Object.is(prevValue, value)) {
      continue;
    }

    // 이벤트 핸들러 교체 (이전 이벤트 핸들러 제거, 새 이벤트 핸들러 추가)
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase();
      if (prevValue) {
        dom.removeEventListener(eventType, prevValue);
      }
      dom.addEventListener(eventType, value);
      continue;
    }

    // className 업데이트 (이전 className 제거, 새 className 설정)
    if (key === "className") {
      dom.className = value || "";
      continue;
    }

    // style 업데이트 (이전 스타일 제거, 새 스타일 설정)
    if (key === "style" && typeof value === "object" && value !== null) {
      // 이전 스타일 제거
      if (prevValue && typeof prevValue === "object") {
        for (const styleKey of Object.keys(prevValue)) {
          if (!(styleKey in value)) {
            (dom.style as any)[styleKey] = "";
          }
        }
      }
      for (const [styleKey, styleValue] of Object.entries(value)) {
        (dom.style as any)[styleKey] = styleValue;
      }
      continue;
    }

    // 일반 속성 업데이트 (이전 속성 제거, 새 속성 설정)
    if (value != null) {
      dom.setAttribute(key, String(value));
    } else {
      dom.removeAttribute(key);
    }
  }
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  // instance가 null이면 빈 배열 반환
  if (!instance) return [];

  // instance.dom이 있으면 배열에 추가하고 반환
  if (instance.dom) {
    return [instance.dom];
  }

  // instance.children의 각 요소에 대해 getDomNodes를 재귀적으로 호출하고 결과를 평탄화하여 반환
  return instance.children.flatMap(getDomNodes);
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  // instance가 null이면 null 반환
  if (!instance) return null;

  // instance.dom이 있으면 반환
  if (instance.dom) {
    return instance.dom;
  }

  // 자식들을 순회하면서 첫 번째 DOM 찾기 (재귀적으로 호출 후 찾으면 즉시 반환)
  for (const child of instance.children) {
    const dom = getFirstDom(child);
    if (dom) return dom;
  }

  return null;
};

/**
 * 자식 인스턴스들로부터 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDomFromChildren = (_children: (Instance | null)[]): HTMLElement | Text | null => {
  // 여기를 구현하세요.
  return null;
};

/**
 * 인스턴스를 부모 DOM에 삽입합니다.
 * anchor 노드가 주어지면 그 앞에 삽입하여 순서를 보장합니다.
 */
export const insertInstance = (
  _parentDom: HTMLElement,
  _instance: Instance | null,
  _anchor: HTMLElement | Text | null = null,
): void => {
  // 여기를 구현하세요.
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (_parentDom: HTMLElement, _instance: Instance | null): void => {
  // 여기를 구현하세요.
};
