export const generateUserId = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `usr_${timestamp}_${randomPart}`;
};

export const generatePelletId = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `plt_${timestamp}_${randomPart}`;
};

export const generateBadgeId = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `bdg_${timestamp}_${randomPart}`;
};

export const generateActivityId = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `act_${timestamp}_${randomPart}`;
};
