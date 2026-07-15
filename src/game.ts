export type Pair = [number, number];
export type Pattern = { id: string; label: string; pairs: Pair[]; weight: number };
export type Region = { id: number; cx: number; cy: number; mask: string; ports: [number, number][] };
export type PatternGeometry = { regions: Region[] };
export type Tile = { id: number; patternId: string; letters: string[]; rotation: number };
export type Cell = { q: number; r: number };

export const HEX = [[50,4],[89.84,27],[89.84,73],[50,96],[10.16,73],[10.16,27]] as [number,number][];
export const MID = HEX.map((point, i) => ({ x:(point[0]+HEX[(i+1)%6][0])/2, y:(point[1]+HEX[(i+1)%6][1])/2 }));
export const PATTERNS: Pattern[] = [
  { id:"basketball", label:"Basketball", pairs:[[1,4],[3,5],[2,6]], weight:35 },
  { id:"offset", label:"Offset weave", pairs:[[1,3],[2,4],[5,6]], weight:50 },
  { id:"geometry-3", label:"Geometry 3", pairs:[[1,2],[3,4],[5,6]], weight:15 },
];
export function cellsForSide(side:number):Cell[]{const radius=side-1;return Array.from({length:radius*2+1},(_,row)=>{const r=row-radius,min=Math.max(-radius,-r-radius),max=Math.min(radius,-r+radius);return Array.from({length:max-min+1},(_,i)=>({q:min+i,r}));}).flat();}
export const CELLS: Cell[] = cellsForSide(3);
export const DIRS = [[1,-1],[1,0],[0,1],[-1,1],[-1,0],[0,-1]] as [number,number][];
export const keyOf = (q:number,r:number) => `${q},${r}`;

export function curvePath([a,b]:Pair){ const p1=MID[a-1],p2=MID[b-1],k=.58; const c1={x:p1.x+(50-p1.x)*k,y:p1.y+(50-p1.y)*k}; const c2={x:p2.x+(50-p2.x)*k,y:p2.y+(50-p2.y)*k}; return `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`; }

function inside(x:number,y:number){ let hit=false; for(let i=0,j=5;i<6;j=i++){ const [xi,yi]=HEX[i],[xj,yj]=HEX[j]; if(((yi>y)!==(yj>y)) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) hit=!hit; } return hit; }
function dseg(px:number,py:number,ax:number,ay:number,bx:number,by:number){ const dx=bx-ax,dy=by-ay; const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))); return Math.hypot(px-(ax+t*dx),py-(ay+t*dy)); }
function cubic(p0:{x:number;y:number},p1:{x:number;y:number},p2:{x:number;y:number},p3:{x:number;y:number},t:number){ const u=1-t; return {x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y}; }

export function analyzePattern(pattern:Pattern):PatternGeometry {
  const n=50, scale=100/n, grid=new Int16Array(n*n).fill(-2);
  for(let y=0;y<n;y++) for(let x=0;x<n;x++){ const px=(x+.5)*scale,py=(y+.5)*scale; if(!inside(px,py)) continue; let wall=false;
    for(const [a,b] of pattern.pairs){ const p0=MID[a-1],p3=MID[b-1],k=.58,p1={x:p0.x+(50-p0.x)*k,y:p0.y+(50-p0.y)*k},p2={x:p3.x+(50-p3.x)*k,y:p3.y+(50-p3.y)*k}; let prev=p0; for(let s=1;s<=36;s++){ const cur=cubic(p0,p1,p2,p3,s/36); if(dseg(px,py,prev.x,prev.y,cur.x,cur.y)<2.45){wall=true;break;} prev=cur;} if(wall) break; }
    grid[y*n+x]=wall?-1:0;
  }
  const comps:{cells:number[];sx:number;sy:number}[]=[]; let id=0;
  for(let start=0;start<grid.length;start++){ if(grid[start]!==0) continue; id++; const cells:number[]=[],queue=[start]; grid[start]=id; let sx=0,sy=0;
    for(let h=0;h<queue.length;h++){ const at=queue[h],x=at%n,y=Math.floor(at/n); cells.push(at);sx+=x;sy+=y; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,ni=ny*n+nx;if(nx>=0&&ny>=0&&nx<n&&ny<n&&grid[ni]===0){grid[ni]=id;queue.push(ni);}} }
    if(cells.length>12) comps.push({cells,sx,sy});
  }
  const regions=comps.map((comp,ri)=>{ const set=new Set(comp.cells); let mask=""; for(let y=0;y<n;y++){ let run=-1; for(let x=0;x<=n;x++){const on=x<n&&set.has(y*n+x); if(on&&run<0)run=x; if(!on&&run>=0){mask+=`M${run*scale} ${y*scale}h${(x-run)*scale}v${scale}h-${(x-run)*scale}z`;run=-1;}}} return {id:ri,cx:(comp.sx/comp.cells.length+.5)*scale,cy:(comp.sy/comp.cells.length+.5)*scale,mask,ports:[] as [number,number][]}; });
  function regionAt(px:number,py:number){ let x=Math.max(0,Math.min(n-1,Math.floor(px/scale))),y=Math.max(0,Math.min(n-1,Math.floor(py/scale))); const target=grid[y*n+x]; if(target>0){const compIndex=comps.findIndex(c=>grid[c.cells[0]]===target);if(compIndex>=0)return compIndex;} let best=-1,bd=1e9; regions.forEach((r,i)=>{const d=Math.hypot(r.cx-px,r.cy-py);if(d<bd){bd=d;best=i;}});return best; }
  HEX.forEach((a,e)=>{const b=HEX[(e+1)%6];[.25,.75].forEach((t,p)=>{let x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;x+=(50-x)*.07;y+=(50-y)*.07;const ri=regionAt(x,y);if(ri>=0)regions[ri].ports.push([e,p]);});});
  return {regions};
}

export function scoreLength(n:number){ if(n>=11)return 24;if(n>=9)return 15;if(n>=7)return 8;if(n>=5)return 3;return n>=3?1:0; }
export function signature(letters:string[]|string){return [...letters].sort().join("");}
export function shuffle<T>(items:T[]){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
