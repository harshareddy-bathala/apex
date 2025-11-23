import React, { FC } from 'react';

interface DailyCheckInProps {
  profile: any;
  idToken: string;
  onComplete: (checkIn: any) => void;
  onClose: () => void;
}

const DailyCheckIn: FC<DailyCheckInProps> = ({
  profile,
  idToken,
  onComplete,
  onClose
}) => {
  return React.createElement('div', null,
    React.createElement('h1', null, 'Daily Check-In'),
    React.createElement('button', { onClick: onClose }, 'Close')
  );
};

export default DailyCheckIn;
