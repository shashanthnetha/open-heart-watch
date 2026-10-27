// The scene uses native scroll position directly. This module documents the
// previous capped controller's removal. No velocity queue is used in Revision IV.
export const scrollProgress=(y,max)=>Math.max(0,Math.min(9,y/Math.max(1,max)*9));
