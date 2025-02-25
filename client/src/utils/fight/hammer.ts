/* eslint-disable no-void */
import { HitStep } from '@labrute/core';
import { Application } from 'pixi.js';

import { sound } from '@pixi/sound';
import { Easing, Tweener } from 'pixi-tweener';
import displayDamage from './displayDamage';
import findFighter, { AnimationFighter } from './findFighter';
import stagger from './stagger';
import updateHp from './updateHp';

const hammer = async (
  app: Application,
  fighters: AnimationFighter[],
  step: HitStep,
  speed: React.MutableRefObject<number>,
) => {
  const fighter = findFighter(fighters, step.fighter);
  if (!fighter) {
    throw new Error('Fighter not found');
  }

  const target = findFighter(fighters, step.target);
  if (!target) {
    throw new Error('Target not found');
  }

  // Set fighter animation to `grab`
  fighter.animation.setAnimation('grab');

  // Set target animation to `grabbed`
  fighter.animation.setAnimation('grabbed');

  // Skill SFX
  void sound.play('skills/hammer', {
    speed: speed.current,
  });

  // Stagger both
  stagger(fighter, speed).catch(console.error);
  stagger(target, speed).catch(console.error);

  // Levitate both
  const animations = [fighter, target].map((f) => Tweener.add({
    target: f.animation.container,
    duration: 0.25 / speed.current,
    ease: Easing.linear
  }, {
    y: f.animation.container.y - 200,
  }));

  // Wait for both animations to finish
  await Promise.all(animations);

  // Wait for 0.2 seconds
  await new Promise((resolve) => {
    setTimeout(resolve, 200 / speed.current);
  });

  // Drop both
  const dropAnimations = [fighter, target].map((f) => Tweener.add({
    target: f.animation.container,
    duration: 0.125 / speed.current,
    ease: Easing.linear
  }, {
    y: f.animation.container.y + 200,
  }));

  // Wait for both animations to finish
  await Promise.all(dropAnimations);

  displayDamage(app, target, step.damage, speed);

  // Update HP bar
  if (target.hpBar) {
    updateHp(target, -step.damage, speed);
  }

  // Set target animation to `idle`
  target.animation.setAnimation('idle');

  // Stagger target
  stagger(target, speed).catch(console.error);
};

export default hammer;