import React from 'react';
import { useLottie } from "lottie-react";
import animationData from '../../public/loading_animation.json'

const LoadingAnimation = () => {
  const options = {
    loop: true,
    autoplay: true, 
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  const { View } = useLottie(options);

  return <>{View}</>
};

export default LoadingAnimation;