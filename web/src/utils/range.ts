export function range(start: number, end: number, step = 1) {
  if (step === 0) {
    throw new Error("step cannot be 0");
  }

  const result = [];

  if (step > 0) {
    for (let i = start; i <= end; i += step) {
      result.push(i);
    }
  } else {
    for (let i = start; i >= end; i += step) {
      result.push(i);
    }
  }

  return result;
}
