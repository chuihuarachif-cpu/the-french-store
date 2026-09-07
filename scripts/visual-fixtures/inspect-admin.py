import json,sys
from pathlib import Path
from html.parser import HTMLParser
class Parser(HTMLParser):
    collect=False
    value=''
    def handle_starttag(self,tag,attrs):
        if tag=='pre' and dict(attrs).get('id')=='fsQaEvidence':self.collect=True
    def handle_endtag(self,tag):
        if tag=='pre':self.collect=False
    def handle_data(self,data):
        if self.collect:self.value+=data
p=Parser();p.feed(Path(sys.argv[1]).read_text());assert p.value,'Admin fixture did not complete'
d=json.loads(p.value);Path(sys.argv[2]).write_text(json.dumps(d,indent=2));print(json.dumps(d))
assert not d['errors'] and not d['blockedWrites'], 'Runtime error or attempted fixture write'
assert d['width']==int(sys.argv[3]) and not d['overflow'], 'Admin responsive overflow'
assert d['app'] if d['state'] not in ('guest','denied') else not d['app'], 'Admin gate presentation failed'
if len(sys.argv)>4 and sys.argv[4]=='r154':
    if d['view'] in ('confirm','info'):assert len(d['checks'])==6, 'Admin dialog focus regression'
    if d['view']=='quotations' and d['app']:
        assert 'Bs 0,00/USDT' not in d['rate'] and 'Bs 0.00/USDT' not in d['rate'], 'Unknown USD rate shown as zero'
        if d['state']=='loading':assert 'Consultando' in d['rate'], 'USD loading lost'
        elif d['state']=='error':assert 'No se pudo' in d['rate'], 'USD error lost'
        else:
            assert '9,27' in d['rate'] or '9.27' in d['rate'], 'Valid USD rate not rendered'
            assert '21.99' in d['copy'], 'Backend quote cents not preserved'
