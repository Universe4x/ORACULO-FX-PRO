#!/usr/bin/env python3
"""ORACULO FX PRO local LAN bridge. Read-only; no trade execution."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json, secrets, socket, time
ROOT=Path(__file__).resolve().parent
TOKEN_FILE=ROOT/'bridge_token.txt'
if TOKEN_FILE.exists(): TOKEN=TOKEN_FILE.read_text(encoding='utf-8').strip()
else:
 TOKEN=secrets.token_urlsafe(32); TOKEN_FILE.write_text(TOKEN,encoding='utf-8')
STATE={'received_at':None,'data':None}
class Handler(BaseHTTPRequestHandler):
 def _send(self,code,obj):
  raw=json.dumps(obj,ensure_ascii=False).encode('utf-8'); self.send_response(code)
  self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(raw)))
  self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','Content-Type, X-ORACULO-TOKEN')
  self.send_header('Access-Control-Allow-Methods','GET, POST, OPTIONS'); self.end_headers()
  if code!=204: self.wfile.write(raw)
 def do_OPTIONS(self): self._send(204,{})
 def do_POST(self):
  if self.path!='/mt5': return self._send(404,{'error':'not found'})
  if self.headers.get('X-ORACULO-TOKEN','')!=TOKEN: return self._send(401,{'error':'unauthorized'})
  try:
   n=int(self.headers.get('Content-Length','0'))
   if n<2 or n>20000: return self._send(400,{'error':'invalid payload size'})
   data=json.loads(self.rfile.read(n).decode('utf-8'))
   if not isinstance(data,dict) or not data.get('symbol') or not isinstance(data.get('bid'),(int,float)) or not isinstance(data.get('ask'),(int,float)): return self._send(400,{'error':'invalid market snapshot'})
   STATE.update(received_at=int(time.time()),data=data); return self._send(200,{'ok':True})
  except Exception as e: return self._send(400,{'error':str(e)})
 def do_GET(self):
  if self.path!='/api/state': return self._send(404,{'error':'not found'})
  if self.headers.get('X-ORACULO-TOKEN','')!=TOKEN: return self._send(401,{'error':'unauthorized'})
  fresh=STATE['received_at'] is not None and time.time()-STATE['received_at']<=15
  return self._send(200,{'connected':fresh,'received_at':STATE['received_at'],'data':STATE['data']})
 def log_message(self,fmt,*args): print('[HTTP] '+fmt%args)
def lan_ip():
 s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
 try: s.connect(('8.8.8.8',80)); return s.getsockname()[0]
 except Exception: return 'IP_NO_DISPONIBLE'
 finally: s.close()
if __name__=='__main__':
 print('\nORACULO FX PRO - PUENTE MT5 SOLO LECTURA')
 print('PC y móvil deben estar en la misma Wi-Fi.')
 print('URL PARA LA APK: http://%s:8765'%lan_ip())
 print('TOKEN (no lo compartas):\n%s\n'%TOKEN)
 print('No abras el puerto 8765 a Internet. Ctrl+C para detener.\n')
 ThreadingHTTPServer(('0.0.0.0',8765),Handler).serve_forever()
