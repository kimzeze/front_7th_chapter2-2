import { context } from "./context";
import { VNode } from "./types";
import { render } from "./render";

/**
 * Mini-React 애플리케이션의 루트를 설정하고 첫 렌더링을 시작합니다.
 *
 * @param rootNode - 렌더링할 최상위 VNode
 * @param container - VNode가 렌더링될 DOM 컨테이너
 */
export const setup = (rootNode: VNode | null, container: HTMLElement): void => {
  // 1. 컨테이너 유효성을 검사합니다.
  if (!container) {
    throw new Error("컨테이너가 제공되어야 합니다.");
  }

  if (!(container instanceof HTMLElement)) {
    throw new Error("컨테이너는 HTMLElement여야 합니다.");
  }

  // 2. 루트 컨텍스트 업데이트 (instance는 유지!)
  const isFirstRender = !context.root.instance;

  context.root.container = container;
  context.root.node = rootNode;
  // context.root.instance는 그대로 유지 → reconcile이 알아서 update/mount 판단

  // 3. 첫 렌더링이면 컨테이너를 비우고 Hook 초기화
  if (isFirstRender) {
    container.innerHTML = "";
    context.hooks.clear();
  } else {
    // 재렌더링이면 visited만 초기화 (render 함수에서도 하지만 안전하게)
    context.hooks.visited.clear();
  }

  // 4. 렌더링 실행 (reconcile이 알아서 mount/update 판단)
  render();
};
