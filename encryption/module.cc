/* * * * * * * * * * * * * * * * * * * * *
 * File:  module.cc                      *
 * Team:  Insecurities                   *
 * Date:  06 April 2018                  *
 * Soln:  njs feistel cipher module      *
 * * * * * * * * * * * * * * * * * * * * */

#include <iostream>
#include <cstring>
#include <string>
#include <cstdint>
#include <algorithm>
#include <node.h>
using namespace std;

using v8::Exception;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

// -- Macros ---------------------------------------------------------------- //
#define MAGIC        6U    // Magic number for the padding section
#define ROUNDS       16U   // Number of rounds that are performed
#define BLOCKSIZE    8U    // (64 bits) Block size of the cipher
#define KEYSIZE      8U    // (64 bits) Expected key size (optional)

// -- Type Definitions ------------------------------------------------------ //
typedef   uint64_t   u64;
typedef    int64_t   i64;

// -- Prototypes ------------------------------------------------------------ //
u64     s2u (string i);     // convert string to unsigned 64
string  u2s (u64 i, u64 s); // convert unsigned 64 to string
string  pad (string txt);   // Returns text evenly divisible by BLOCKSIZE
string  dap (string txt);   // Returns text that strips padding
string  rnd (string blk, string key);   // Rounding function
string  fsl (string txt, string key);   // Feistel cipher

// -- Implementations ------------------------------------------------------- //
u64 s2u (string i) {
    u64 result;
    memcpy(&result, &i[0], sizeof(u64));
    return result;
}
string u2s (u64 i, u64 s) {
    string result = "";
    for (u64 j = 0; j < s; j++) {
        result += (i >> (8*j)) & 0xff;
    }
    return result;
}
string pad (string plaintext) {
    /*
     * magic   the first character of the padding
     * amount  the total length of the padding
     */
    char magic  = MAGIC;
    u64  amount = (plaintext.size()%BLOCKSIZE) ? \
                        BLOCKSIZE-(plaintext.size()%BLOCKSIZE):0;
    return (amount>0) ? plaintext.append(1u, magic).append(amount-1, '.')\
                      : plaintext;
}
string dap (string ciphertext) {
    /*
     * magic   the first character of the padding
     * amount  the index of the magic character
     */
    char magic = MAGIC;
    u64  pos   = ciphertext.find(magic);
    return (pos != string::npos) ? ciphertext.substr(0, pos) : ciphertext;
}
string rnd (string blk, string key) {
    string result = "";
    /* use evenness to change sign*/
    for(u64 i = 0; i < blk.size(); ++i) {
        result += (i%2) ? (blk[i] - key[i%key.size()])\
                        : (blk[i] + key[i%key.size()]);
    }
    return result;
}
string fsl (string txt, string key) {
    /*
     * ptxt  padded plain text
     * blks  number of blocks
     * ctxt  the resulting ciphertext to return
     */
    string ptxt = pad(txt);
    u64    blks = ptxt.size() / BLOCKSIZE;
    string ctxt = "";

    /* implement fiestel cipher */
    for (u64 i = 0; i < blks; i++) {
        /* calculate and assign block halves */
        u64 pos  = i*8;
        u64 far  = pos+(BLOCKSIZE/2);
        string l = ptxt.substr(pos,BLOCKSIZE/2);
        string r = ptxt.substr(far,BLOCKSIZE/2);
        /* run rounds */
        for (u64 j = 0; j < ROUNDS; j++) {
            string f = rnd(r, key);
            l = u2s(s2u(l)^s2u(f),BLOCKSIZE/2);
            f = l;
            l = r;
            r = f;
        }
        ctxt += r+l;
    }
    return ctxt;
}
// -- NodeJS ---------------------------------------------------------------- //
void bridge (const FunctionCallbackInfo<Value>& args) {
	Isolate * isolate = args.GetIsolate();
	string txt ((char*) *(args[0]->ToString()));
	string key ((char*) *(args[0]->ToString()));
	string res = fsl(txt, key);
	Local<String> ret = v8::String::NewFromUtf8(isolate, res.c_str());
	args.GetReturnValue().Set(ret);
}
void init(Local<Object> exports) {
	NODE_SET_METHOD(exports, "cipher", bridge);
}
NODE_MODULE(NODE_GYP_MODULE_NAME, init)