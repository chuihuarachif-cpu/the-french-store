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
# The baseline records overflow and request counts before applying corrections.
# Per-change invariants are asserted by their dedicated regression tests.
