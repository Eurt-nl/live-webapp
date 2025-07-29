export const scoreColors = {
  score1: '#ffb400',
  score2: 'rgba(62, 195, 0, 0.34)',
  score3: 'rgba(62, 195, 0, 0.64)',
  score4: 'rgba(244, 43, 3, 0.12)',
  score5: 'rgba(244, 43, 3, 0.26)',
  score6Plus: 'rgba(244, 43, 3, 0.64)',
} as const;

export const getScoreColor = (score: number) => {
  if (!score) return '';

  switch (score) {
    case 1:
      return scoreColors.score1;
    case 2:
      return scoreColors.score2;
    case 3:
      return '';
    case 4:
      return scoreColors.score4;
    case 5:
      return scoreColors.score5;
    default:
      return score > 5 ? scoreColors.score6Plus : '';
  }
};
