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
  _dom: HTMLElement,
  _prevProps: Record<string, any> = {},
  _nextProps: Record<string, any> = {},
): void => {
  // 여기를 구현하세요.
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (_instance: Instance | null): (HTMLElement | Text)[] => {
  // 여기를 구현하세요.
  return [];
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (_instance: Instance | null): HTMLElement | Text | null => {
  // 여기를 구현하세요.
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
