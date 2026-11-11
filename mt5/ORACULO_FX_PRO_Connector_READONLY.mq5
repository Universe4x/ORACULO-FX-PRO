// ORACULO FX PRO - MT5 READ-ONLY LAN CONNECTOR v1.0
// Sends quotes and account summary to the local Python bridge. It NEVER places or closes trades.
#property strict
#property version "1.00"
#property description "Read-only connector for ORACULO FX PRO. No trading functions."

input string BridgeURL = "http://127.0.0.1:8765/mt5";
input string AccessToken = "PASTE_TOKEN_FROM_BRIDGE_HERE";
input int    SendEverySeconds = 2;
input bool   SendAllSymbols = false; // false = only chart symbol
input bool   IncludeAccountSummary = true;

string JsonEscape(string s)
{
   StringReplace(s, "\\", "\\\\");
   StringReplace(s, "\"", "\\\"");
   StringReplace(s, "\r", " ");
   StringReplace(s, "\n", " ");
   return s;
}

string BuildPayload()
{
   string symbol = _Symbol;
   MqlTick tick;
   if(!SymbolInfoTick(symbol, tick)) return "";
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   double spread_points = point > 0 ? (tick.ask - tick.bid) / point : 0;
   string payload = "{\"symbol\":\"" + JsonEscape(symbol) + "\",\"time\":" + IntegerToString((long)TimeCurrent()) +
      ",\"bid\":" + DoubleToString(tick.bid, digits) + ",\"ask\":" + DoubleToString(tick.ask, digits) +
      ",\"spread_points\":" + DoubleToString(spread_points, 1) +
      ",\"digits\":" + IntegerToString(digits);
   if(IncludeAccountSummary)
   {
      payload += ",\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) +
         ",\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) +
         ",\"profit\":" + DoubleToString(AccountInfoDouble(ACCOUNT_PROFIT), 2) +
         ",\"currency\":\"" + JsonEscape(AccountInfoString(ACCOUNT_CURRENCY)) + "\"";
      int positions = PositionsTotal();
      payload += ",\"open_positions\":" + IntegerToString(positions);
   }
   payload += "}";
   return payload;
}

void SendSnapshot()
{
   if(StringLen(AccessToken) < 12 || StringFind(AccessToken, "PASTE_TOKEN") >= 0)
   {
      Comment("ORACULO FX PRO: configura AccessToken en Inputs");
      return;
   }
   string body = BuildPayload();
   if(body == "") return;
   char data[], result[];
   StringToCharArray(body, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(ArraySize(data) > 0) ArrayResize(data, ArraySize(data)-1); // remove terminal zero
   string headers = "Content-Type: application/json\r\nX-ORACULO-TOKEN: " + AccessToken + "\r\n";
   string response_headers;
   ResetLastError();
   int code = WebRequest("POST", BridgeURL, headers, 5000, data, result, response_headers);
   if(code == 200)
      Comment("ORACULO FX PRO CONNECTED | ", _Symbol, " | ", TimeToString(TimeCurrent(), TIME_SECONDS));
   else
      Comment("ORACULO FX PRO bridge error: HTTP ", code, " | MQL5 error ", GetLastError(),
              " | Add http://127.0.0.1:8765 to Tools > Options > Expert Advisors > WebRequest allowlist");
}

int OnInit()
{
   EventSetTimer(MathMax(1, SendEverySeconds));
   SendSnapshot();
   return INIT_SUCCEEDED;
}
void OnDeinit(const int reason) { EventKillTimer(); Comment(""); }
void OnTimer() { SendSnapshot(); }
void OnTick() { /* timer controls send frequency */ }
