# Adds up the shards of tools/ludus-map-eval.js: python3 tools/ludus-map-eval-sum.py shard0.txt shard1.txt ...
import json,sys,collections,math
rows=[]; params={}
for f in sys.argv[1:]:
    for line in open(f):
        line=line.strip()
        if not line.startswith('{'): continue
        d=json.loads(line); rows+=d['rows']; params=d['params']
print('params',params,'snapshots',len(rows))
shifts=['-2','-1','0','1','2']
# per column: mean round / final win rate at shift 0, and the win rate by shift over all bouts
by=collections.defaultdict(list)
for r in rows: by[r['col']].append(r)
print('col  n  d~    gifts | round@0 final@0 | fit')
allr={s:[] for s in shifts}; allf={s:[] for s in shifts}
for c in sorted(by):
    rs=by[c]
    rr=[x for r in rs for x in r['res']['0'][:-1]]; ff=[r['res']['0'][-1] for r in rs]; fits=[x for r in rs for x in r['fits']]
    for r in rs:
        for s in shifts:
            allr[s]+=r['res'][s][:-1]; allf[s].append(r['res'][s][-1])
    print('%2d  %2d  %+.1f  %.1f  |  %.2f   %.2f  | %.2f'%(c,len(rs),sum(r['d'] for r in rs)/len(rs),sum(r['gifts'] for r in rs)/len(rs),sum(rr)/max(1,len(rr)),sum(ff)/len(ff),sum(fits)/len(fits)))
print('win rate by level shift (all columns):')
for s in shifts: print('  shift %+d  round %.3f  final %.3f'%(int(s),sum(allr[s])/len(allr[s]),sum(allf[s])/len(allf[s])))
# per column group
groups={'1-3':range(1,4),'4-6':range(4,7),'7-9':range(7,10),'10':range(10,11)}
for g,rg in groups.items():
    rs=[r for r in rows if r['col'] in rg]
    if not rs: continue
    print('cols',g,' '.join('%+d: %.2f/%.2f'%(int(s),sum(x for r in rs for x in r['res'][s][:-1])/max(1,sum(len(r['res'][s][:-1]) for r in rs)),sum(r['res'][s][-1] for r in rs)/len(rs)) for s in shifts))
cl=[math.prod(r['res']['0']) for r in rows]
print('mean cup clear chance (shift 0): %.3f'%(sum(cl)/len(cl)))
