
declare module 'react-confetti' {
    import React from 'react';

    export interface ConfettiProps {
        width?: number;
        height?: number;
        numberOfPieces?: number;
        friction?: number;
        wind?: number;
        gravity?: number;
        initialVelocityX?: number;
        initialVelocityY?: number;
        colors?: string[];
        opacity?: number;
        recycle?: boolean;
        run?: boolean;
        onConfettiComplete?: (confetti: HTMLCanvasElement) => void;
    }

    export default class ReactConfetti extends React.Component<ConfettiProps> { }
}
