import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { ComponentType, Instance, VNode } from "./types";
import {
  getFirstDom,
  getFirstDomFromChildren,
  insertInstance,
  removeInstance,
  setDomProps,
  updateDomProps,
} from "./dom";
import { createChildPath } from "./elements";
import { isEmptyValue } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ = { getFirstDom, getFirstDomFromChildren, insertInstance, removeInstance };

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
    return mountComponent(parentDom, node, path);
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

const update = (parentDom: HTMLElement, node: VNode, instance: Instance, path: string): Instance => {
  // 1. TEXT_ELEMENT
  if (node.type === TEXT_ELEMENT) {
    const textNode = instance.dom as Text;
    const oldValue = instance.node.props.nodeValue;
    const newValue = node.props.nodeValue;

    if (oldValue !== newValue) {
      textNode.nodeValue = newValue || "";
    }

    return {
      ...instance,
      node: node,
    };
  }

  // 2. Fragment
  if (node.type === Fragment) {
    const childInstances = reconcileChildren(parentDom, node.props.children || [], instance.children, path);

    return {
      ...instance,
      node: node,
      children: childInstances,
    };
  }

  // 3. Component
  if (typeof node.type === "function") {
    return updateComponent(parentDom, node, instance, path);
  }

  // 4. 일반 DOM
  const dom = instance.dom as HTMLElement;

  // Props 업데이트
  updateDomProps(dom, instance.node.props, node.props);

  // Children reconcile
  const childInstances = reconcileChildren(dom, node.props.children || [], instance.children, path);

  return {
    ...instance,
    node: node,
    children: childInstances,
  };
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

const reconcileChildren = (
  container: HTMLElement,
  newChildren: VNode[],
  oldChildren: (Instance | null)[],
  path: string,
): (Instance | null)[] => {
  const childInstances: (Instance | null)[] = [];
  const maxLength = Math.max(newChildren.length, oldChildren.length);

  for (let i = 0; i < maxLength; i++) {
    const newChild = newChildren[i];
    const oldChild = oldChildren[i] || null;

    // Case 1: 둘 다 있음 (update or replace)
    // Case 2: newChild만 있음 (mount)
    if (newChild && !isEmptyValue(newChild)) {
      const childPath = createChildPath(path, newChild.key, i, newChild.type);

      const childInstance = reconcile(
        container,
        oldChild, // 이전 것 (없으면 null → mount)
        newChild, // 새것
        childPath,
      );

      childInstances.push(childInstance);
    }
    // Case 3: oldChild만 있음 (unmount)
    else if (oldChild) {
      reconcile(container, oldChild, null, "");
      // unmount니까 childInstances에 안 넣음!
    }
  }

  return childInstances;
};

/**
 * mountComponent: 컴포넌트를 처음 마운트합니다.
 *
 * 🎯 역할: 함수 컴포넌트를 실행해서 실제 DOM으로 만들기
 *
 * 📦 과정:
 * 1. Hook 컨텍스트 설정 (이 컴포넌트의 useState들을 추적하기 위해)
 * 2. 컴포넌트 함수 실행 (설계도 → 실제 VNode)
 * 3. 나온 결과를 mount (VNode → DOM)
 * 4. Hook 컨텍스트 정리
 *
 * @example
 * function Counter() {
 *   const [count] = useState(0);
 *   return <div>{count}</div>;
 * }
 *
 * mountComponent(parentDom, <Counter />, "root.c0")
 * → Counter 함수 실행
 * → <div>0</div> VNode 얻음
 * → 실제 DOM으로 만듦
 */
const mountComponent = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  // 1. Hook 컨텍스트 시작
  //    "지금부터 이 컴포넌트의 Hook들이 실행됩니다!" 라고 알림
  context.hooks.componentStack.push(path);
  context.hooks.cursor.set(path, 0); // Hook 카운터 초기화
  context.hooks.visited.add(path); // 방문 기록

  try {
    // 2. 컴포넌트 함수 실행
    //    예: Counter({ count: 5 }) → <div>5</div>
    const Component = node.type as ComponentType;
    const renderedVNode = Component(node.props) as VNode;

    // 3. 실행 결과를 실제 DOM으로 mount
    //    <div>5</div> → 진짜 DOM 요소
    const childInstance = mount(parentDom, renderedVNode, path);

    // 4. 컴포넌트 인스턴스 반환
    return {
      kind: NodeTypes.COMPONENT,
      dom: null, // 컴포넌트는 직접 DOM 없음 (자식이 가짐)
      node: node,
      children: [childInstance], // 실행 결과가 자식
      key: node.key,
      path: path,
    };
  } finally {
    // 5. Hook 컨텍스트 정리
    //    "이 컴포넌트 실행 끝!" 라고 알림
    context.hooks.componentStack.pop();
  }
};

/**
 * updateComponent: 기존 컴포넌트를 업데이트합니다.
 *
 * 🎯 역할: 컴포넌트를 다시 실행해서 변경사항 반영하기
 *
 * 📦 과정:
 * 1. Hook 컨텍스트 설정 (기존 state 유지하면서)
 * 2. 컴포넌트 함수 다시 실행
 * 3. 이전 결과와 새 결과를 reconcile
 * 4. Hook 컨텍스트 정리
 *
 * @example
 * // 이전: <div>0</div>
 * // setState(1) 호출됨
 * // updateComponent 실행
 * // → Counter 함수 다시 실행
 * // → <div>1</div> 얻음
 * // → reconcile로 DOM 업데이트
 */
const updateComponent = (parentDom: HTMLElement, node: VNode, instance: Instance, path: string): Instance => {
  // 1. Hook 컨텍스트 시작
  context.hooks.componentStack.push(path);
  context.hooks.cursor.set(path, 0); // Hook 카운터 다시 0부터
  context.hooks.visited.add(path);

  try {
    // 2. 컴포넌트 함수 다시 실행
    //    이번엔 업데이트된 state를 가지고 실행됨!
    const Component = node.type as ComponentType;
    const renderedVNode = Component(node.props) as VNode;

    // 3. 이전 자식과 새 자식을 비교 (reconcile)
    //    예: <div>0</div> vs <div>1</div> → 텍스트만 바꿈
    const oldChild = instance.children[0];
    const newChild = reconcile(parentDom, oldChild, renderedVNode, path);

    // 4. 업데이트된 인스턴스 반환
    return {
      ...instance,
      node: node,
      children: [newChild],
    };
  } finally {
    // 5. Hook 컨텍스트 정리
    context.hooks.componentStack.pop();
  }
};
