export function compareTwoStrings(first: string, second: string) {
  const firstTrimmed = first.replace(/\s+/g, '');
  const secondTrimmed = second.replace(/\s+/g, '');

  if (firstTrimmed === secondTrimmed) {
    return 1; // identical or empty
  }
  if (firstTrimmed.length < 2 || secondTrimmed.length < 2) {
    return 0; // if either is a 0-letter or 1-letter string
  }

  const firstBigrams = new Map();
  for (let i = 0; i < firstTrimmed.length - 1; i++) {
    const bigram = firstTrimmed.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;

    firstBigrams.set(bigram, count);
  }

  let intersectionSize = 0;
  for (let i = 0; i < secondTrimmed.length - 1; i++) {
    const bigram = secondTrimmed.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;

    if (count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (
    (2.0 * intersectionSize) / (firstTrimmed.length + secondTrimmed.length - 2)
  );
}

export function findBestMatch(mainString: string, targetStrings: string[]) {
  if (!areArgsValid(mainString, targetStrings)) {
    throw new Error(
      'Bad arguments: First argument should be a string, second should be an array of strings'
    );
  }

  const ratings: { target: string; rating: number }[] = [];
  let bestMatchIndex = 0;

  for (let i = 0; i < targetStrings.length; i++) {
    const currentTargetString = targetStrings[i];
    const currentRating = compareTwoStrings(mainString, currentTargetString);
    ratings.push({ target: currentTargetString, rating: currentRating });
    if (currentRating > ratings[bestMatchIndex].rating) {
      bestMatchIndex = i;
    }
  }

  const bestMatch = ratings[bestMatchIndex];

  return {
    ratings,
    bestMatch,
    bestMatchIndex,
  };
}

function areArgsValid(mainString: string, targetStrings: string[]) {
  if (typeof mainString !== 'string') {
    return false;
  }
  if (!Array.isArray(targetStrings)) {
    return false;
  }
  if (!targetStrings.length) {
    return false;
  }
  if (targetStrings.find((s) => typeof s !== 'string')) {
    return false;
  }
  return true;
}
