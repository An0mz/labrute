/* eslint-disable no-void */
import { ArriveStep } from '@labrute/core';
import { Easing, Tweener } from 'pixi-tweener';
import { AnimatedSprite, Application } from 'pixi.js';

import { sound } from '@pixi/sound';
import { getRandomPosition } from './fightPositions';
import findFighter, { AnimationFighter } from './findFighter';

const arrive = async (
  app: Application,
  fighters: AnimationFighter[],
  step: ArriveStep,
  speed: React.MutableRefObject<number>,
) => {
  if (!app.loader) {
    return;
  }
  const { loader: { resources: { '/images/game/misc.json': { spritesheet } } } } = app;

  if (!spritesheet) {
    throw new Error('Spritesheet not found');
  }

  const fighter = findFighter(fighters, step.fighter);

  if (!fighter) {
    throw new Error('Fighter not found');
  }

  // Get random position
  const { x, y } = getRandomPosition(fighters, fighter.animation.team);

  fighter.animation.once('arrive:start', () => {
    fighter.animation.pause();
  });
  fighter.animation.setAnimation('arrive');

  // Wait 0.25s before playing arrive SFX
  setTimeout(() => {
    void sound.play('arrive', { speed: speed.current });
  }, 250 / speed.current);

  // Move fighter to the position
  await Tweener.add({
    target: fighter.animation.container,
    duration: 0.5 / speed.current,
    ease: Easing.linear
  }, { x, y });

  const animationEnded = fighter.animation.waitForEvent('arrive:end');

  // Finish the arrive animation
  fighter.animation.play();

  // Create dust sprite
  const dustSprite = new AnimatedSprite(spritesheet.animations.dust);
  dustSprite.animationSpeed = speed.current / 2;
  dustSprite.loop = false;

  // Set dust sprite position
  dustSprite.x = fighter.animation.container.x;
  dustSprite.y = fighter.animation.container.y + 20;

  // Add dust sprite to stage
  app.stage.addChild(dustSprite);

  // Destroy dust sprite when animation ends
  dustSprite.onComplete = () => {
    dustSprite.destroy();
  };

  // Play dust
  dustSprite.play();

  // Wait for animation to end before going further
  await animationEnded;

  // Set animation to `idle`
  fighter.animation.setAnimation('idle');
};

export default arrive;