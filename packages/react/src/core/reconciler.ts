import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import { setDomProps } from "./dom";
import { createChildPath } from "./elements";
import { isEmptyValue } from "../utils";

/**
 * 이전 인스턴스와 새로운 VNode를 비교하여 DOM을 업데이트하는 재조정 과정을 수행합니다.
 *
 * reconcile = React의 "다른 그림 찾기" 전문가
 *
 * @param parentDom - 부모 DOM 요소
 * @param instance - 이전 렌더링의 인스턴스
 * @param node - 새로운 VNode
 * @param path - 현재 노드의 고유 경로
 * @returns 업데이트되거나 새로 생성된 인스턴스
 *
 *  1. 새 노드가 null이면 기존 인스턴스를 제거합니다. (unmount)
 *  2. 기존 인스턴스가 없으면 새 노드를 마운트합니다. (mount)
 *  3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트합니다.
 *  4. 타입과 키가 같으면 인스턴스를 업데이트합니다. (update)
 *    - DOM 요소: updateDomProps로 속성 업데이트 후 자식 재조정
 *    - 컴포넌트: 컴포넌트 함수 재실행 후 자식 재조정
 */
export const reconcile = (
  parentDom: HTMLElement,
  instance: Instance | null,
  node: VNode | null,
  path: string,
): Instance | null => {
  // Case 1: unmount (새것 없음)
  if (node === null) {
    if (instance) {
      unmount(parentDom, instance);
    }
    return null;
  }

  // Case 2: mount (이전 것 없음)
  if (instance === null) {
    return mount(parentDom, node, path);
  }

  // Case 3: replace (타입 다름)
  if (node.type !== instance.node.type) {
    const newInstance = mount(parentDom, node, path);
    unmount(parentDom, instance);
    return newInstance;
  }

  // Case 4: update (타입 같음)
  return update(parentDom, node, instance, path);
};

/**
 * mount: 새로 만들기
 * 1. DOM 요소 생성
 * 2. 속성 설정
 * 3. 자식들 mount
 * 4. DOM에 삽입
 */
const mount = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  if (node.type === TEXT_ELEMENT) {
    // 1. 텍스트 노드 생성
    const textNode = document.createTextNode(node.props.nodeValue || "");

    // 2. DOM에 삽입
    parentDom.appendChild(textNode);

    // 3. Instance 반환
    return {
      kind: "text",
      dom: textNode,
      node: node,
      children: [],
      key: node.key,
      path: path,
    };
  }

  if (node.type === Fragment) {
    // 1. 자식들만 mount (Fragment 자체는 DOM 없음)
    const childInstances: (Instance | null)[] = [];

    // 2. 자식들만 mount (Fragment 자체는 DOM 없음)
    for (const child of node.props.children || []) {
      if (!isEmptyValue(child)) {
        const childPath = createChildPath(path, child.key, childInstances.length, child.type);
        const childInstance = mount(parentDom, child, childPath);
        childInstances.push(childInstance);
      }
    }

    // 3. Instance 반환 (dom은 null)
    return {
      kind: "fragment",
      dom: null,
      node: node,
      children: childInstances,
      key: node.key,
      path: path,
    };
  }

  if (typeof node.type === "function") {
    // return mountComponent(parentDom, node, path);
  }

  // 1. 일반 DOM 요소 생성
  const dom = document.createElement(node.type as string);

  // 2. Props 적용
  setDomProps(dom, node.props);

  // 3. 자식들 마운트
  const childInstances: (Instance | null)[] = [];
  for (const child of node.props.children || []) {
    if (!isEmptyValue(child)) {
      const childPath = createChildPath(path, child.key, childInstances.length, child.type);
      const childInstance = mount(dom, child, childPath);
      childInstances.push(childInstance);
    }
  }

  // 4. DOM에 추가
  parentDom.appendChild(dom);

  return {
    kind: NodeTypes.HOST,
    dom: dom,
    node: node,
    children: childInstances,
    key: node.key,
    path: path,
  };
};

/**
 * update: 수정하기
 * 1. 속성 비교 & 업데이트
 * 2. 자식들 reconcile (재귀!)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const update = (parentDom: HTMLElement, node: VNode, instance: Instance, path: string): Instance => {
  // TODO: 구현 필요
  return instance;
};

/**
 * unmount: 제거하기
 * 1. cleanup 함수 실행 (나중에 Effect Hook 구현 후 추가)
 * 2. 자식들 먼저 unmount (재귀)
 * 3. DOM 제거
 * 4. Hook 정리
 */
const unmount = (parentDom: HTMLElement, instance: Instance): void => {
  // 1. cleanup 함수 실행
  // if (instance.cleanup) {
  //   instance.cleanup();
  // }

  // 2. 자식들 먼저 unmount (재귀)
  for (const child of instance.children) {
    if (child) {
      // 자식이 있는지 확인
      // childContainer: Fragment면 parentDom, 아니면 instance.dom 사용
      const childContainer = instance.dom instanceof HTMLElement ? instance.dom : parentDom;
      unmount(childContainer, child);
    }
  }

  // 3. DOM 제거
  if (instance.dom) {
    if (instance.dom.parentNode) {
      instance.dom.parentNode.removeChild(instance.dom);
    }
  }

  // 4. Hook 정리 (메모리 해제)
  if (instance.path) {
    context.hooks.state.delete(instance.path);
    context.hooks.cursor.delete(instance.path);
  }
};
