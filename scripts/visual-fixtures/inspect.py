from html.parser import HTMLParser
from pathlib import Path
import json,sys

class Evidence(HTMLParser):
    collecting=False
    payload=''
    def handle_starttag(self,tag,attrs):
        if tag=='pre' and dict(attrs).get('id')=='fsQaEvidence':self.collecting=True
    def handle_endtag(self,tag):
        if tag=='pre':self.collecting=False
    def handle_data(self,data):
        if self.collecting:self.payload+=data

parser=Evidence();parser.feed(Path(sys.argv[1]).read_text())
assert parser.payload, 'Browser fixture never reported ready'
data=json.loads(parser.payload)
Path(sys.argv[2]).write_text(json.dumps(data,indent=2))
print(json.dumps(data))
assert data['bootstrap']=='ready','Bootstrap failed'
assert not data['errors'], 'Uncaught browser errors'
assert data['membership']==data['rank'], 'Rank fixture did not render the actual theme'
assert data['width']==int(sys.argv[3]), 'Chrome did not use the requested layout viewport'
assert not data['overflow'], 'Horizontal overflow'
assert data['calls'].get('get_my_loyalty_summary',0)<=12, 'Rank read loop returned'
assert data['calls'].get('get_my_loyalty_launch_progress',0)<=12, 'Rank launch read loop returned'
if data['scenario'] in ('lite','reduced'):
    assert data['motion'] in ('lite','off'), 'Progressive motion was ignored'
    assert data['heroAnimation']=='none' and data['ribbonAnimation']=='none', 'Decorative sweep runs in lightweight mode'
elif data['rank']=='diamond':
    assert data['heroAnimation']=='fsDiamondHeroSweep', 'Diamond hero sweep was removed'
    assert data['ribbonAnimation']=='fsRankRibbonGlint', 'Diamond ribbon glint was removed'
