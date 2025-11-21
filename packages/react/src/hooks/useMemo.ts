import { DependencyList } from "./types";
import { useState } from "../core/hooks";
import { shallowEquals } from "../utils";

/**
 * 계산 비용이 큰 함수의 결과를 메모이제이션합니다.
 * 의존성 배열(deps)의 값이 변경될 때만 함수를 다시 실행합니다.
 *
 * @param factory - 메모이제이션할 값을 생성하는 함수
 * @param deps - 의존성 배열
 * @param equals - 의존성을 비교할 함수 (기본값: shallowEquals)
 * @returns 메모이제이션된 값
 */
export const useMemo = <T>(factory: () => T, deps: DependencyList, equals = shallowEquals): T => {
  // useState로 캐시 관리 (useRef 대신)
  const [cache, setCache] = useState<{
    value: T;
    deps: DependencyList;
  }>(() => ({
    value: factory(),
    deps,
  }));

  // 의존성이 변경되었는지 확인
  if (!equals(cache.deps, deps)) {
    // 변경되었으면 새 값 계산하고 캐시 업데이트
    const newValue = factory();
    const newCache = { value: newValue, deps };
    setCache(newCache);
    return newValue;
  }

  // 의존성이 변경되지 않았으면 캐시된 값 반환
  return cache.value;
};
