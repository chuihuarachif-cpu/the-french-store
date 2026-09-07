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
assert not data.get('blockedWrites'), 'Fixture attempted a write or unapproved RPC'
assert data['membership']==data['rank'], 'Rank fixture did not render the actual theme'
assert data['width']==int(sys.argv[3]), 'Chrome did not use the requested layout viewport'
assert not data['overflow'], 'Horizontal overflow'
assert data['calls'].get('get_my_loyalty_summary',0)<=12, 'Rank read loop returned'
assert data['calls'].get('get_my_loyalty_launch_progress',0)<=12, 'Rank launch read loop returned'
feature={'wallet':'wallet','pedidos':'orders','cart':'checkout','qr':'checkout'}.get(data['view'])
if feature:
    assert data['features'].get(feature)=='1', 'The actual lazy feature was not loaded'
if data['view']=='qr':
    assert data['qrDecorator'], 'QR must use the active BISA UI'
if len(sys.argv)>4 and sys.argv[4]=='r151':
    if data['view'] in ('cart','qr','auth','topup'):
        assert len(data['focusChecks'])==6, 'Dialog focus/Escape/background regression'
    if data['view']=='wallet':
        expected={'error':'error','loading':'loading'}.get(data['scenario'],'ready')
        assert data['wallet']['state']==expected, 'Wallet read state is ambiguous'
        if expected in ('error','loading'):
            assert data['wallet']['balance']=='—', 'Unknown balance is displayed as money'
        elif data['scenario']=='zero':
            assert data['wallet']['balance'].replace(',','.')=='Bs 0.00', 'Real zero balance was lost'
        else:
            assert data['wallet']['balance'].replace(',','.')=='Bs 70.30', 'Valid balance/cents changed'
        expected_history={'empty':'empty','error':'error','loading':'loading','transaction_error':'error'}.get(data['scenario'],'ready')
        assert data['wallet']['history']==expected_history, 'Transaction read failure/empty state confused'
if data['scenario'] in ('lite','reduced'):
    assert data['motion'] in ('lite','off'), 'Progressive motion was ignored'
    assert data['heroAnimation']=='none' and data['ribbonAnimation']=='none', 'Decorative sweep runs in lightweight mode'
elif data['rank']=='diamond':
    assert data['heroAnimation']=='fsDiamondHeroSweep', 'Diamond hero sweep was removed'
    assert data['ribbonAnimation']=='fsRankRibbonGlint', 'Diamond ribbon glint was removed'

if len(sys.argv)>5 and sys.argv[5]=='r153' and data['view']=='pedidos':
    expected={'error':'error','empty':'empty','loading':'loading'}.get(data['scenario'],'ready')
    assert data['orders']['state']==expected, 'Orders loading/error/empty states confused'

if len(sys.argv)>4 and sys.argv[4]=='r151' and data['view']=='cart':
    if data['scenario']=='normal':
        assert len(data['cartChecks'])==9, 'Cart quantity/limit/removal/checkout focus regression'
    if data['scenario']=='checkout_loading':
        assert data['checkout']['disabled'] and float(data['checkout']['opacity'])<=.7, 'Both payment choices must visibly show their busy state'
        assert data['checkout']['busy']=='true', 'Checkout loading is not communicated'
        assert 'Revisando' in data['checkout']['progress'], 'Checkout validation progress is missing'
