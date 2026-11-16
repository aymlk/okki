// @ts-check
// In-page presentation only; growth cards require explicit manual authorization.
import {enqueueMessageCard, resetMessageCards} from './message-cards.js';
/** @typedef {{channel:"tm"|"wa"|"mail",id:string,name:string,avatar:string,body:string,count?:number,context?:string,translation?:string,country?:string,time?:string,location?:string,flag?:string}} NotificationPayload */

/** @param {NotificationPayload} payload @param {() => void} openTarget @param {boolean} [autoOpen] @param {boolean} [showCards] */
export function showAppleNotification(payload,openTarget,autoOpen=false,showCards=false) {
  document.getElementById('arrivalNotification')?.remove();
  if (autoOpen) {resetMessageCards();openTarget();return null;}
  return showCards ? enqueueMessageCard(payload,openTarget) : null;
}
