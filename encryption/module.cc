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
#include <valarray>
#include <node.h>
#include "node_modules/nan/nan.h"

//// STL ///////////////
using std::cin;       //
using std::cout;      //
using std::string;    //
using std::find;      //
using std::reverse;   //
using std::valarray;  //
using std::max;       //
using std::rotate;    //
////////////////////////

//// V8 ////////////////
using v8::Object;     //
using v8::Local;      //
using v8::Value;      //
using v8::String;     //
////////////////////////

// -- Macros ---------------------------------------------------------------- //
#define MAGIC        6U    // Magic number for the padding section
#define ROUNDS       32U    // Number of rounds that are performed
#define BLOCKSIZE    32U   // (64 bits) Block size of the cipher

// -- Type Definitions ------------------------------------------------------ //
typedef   uint64_t   u64;
typedef   uint32_t   u32;
typedef    int64_t   i64;
typedef          __int128  i128;
typedef unsigned __int128  u128;

// -- Prototypes ------------------------------------------------------------ //
u128    s2u (string i);      // convert string to unsigned 64
string  u2s (u128 i, u64 s); // convert unsigned 64 to string
string  pad (string txt);    // Returns text evenly divisible by BLOCKSIZE
string  dap (string txt);    // Returns text that strips padding
string  rnd (string blk, string key);   // Rounding function
string  fsl (string txt, string key);   // Feistel cipher

// -- Implementations ------------------------------------------------------- //
u128 s2u (string i) {
    u128 result;
    memcpy(&result, &i[0], sizeof(u128));
    return result;
}
string u2s (u128 i, u64 s) {
    string result("");
    result.resize(s);
    memcpy(&result[0], &i, s);
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
    /* rotate key */
    rotate(key.begin(), key.begin()+(key.size()/2), key.end());

    /* shifting (stream cipher), use eveness to change direction */
    for(u64 i = 0; i < max(blk.size(), key.size()); i++) {
        blk[i%blk.size()] += key[i%key.size()];
    }

    /* circular shift result as a function of key magnitude */
    u64 m = 0;
    for (u64 i = 0; i < key.size(); i++) m += key[i];
    valarray<string> x (blk, blk.size());
    x.cshift(m % blk.size());
    string result = "";
    for (u64 i = 0; i < x.size(); i++) result += x[i];

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
        u128 pos = i*32;
        u128 far = pos+(BLOCKSIZE/2);
        string l = ptxt.substr(pos,BLOCKSIZE/2);
        string r = ptxt.substr(far,BLOCKSIZE/2);
        /* run rounds */
        for (u64 j = 0; j < ROUNDS; j++) {
            string skey = key.substr(j%key.size(), 1);
            string f(rnd(r, key));
            l = u2s((s2u(l)^s2u(f)),BLOCKSIZE/2);
            f = l;
            l = r;
            r = f;
        }
        ctxt += r+l;
    }
    return ctxt;
}
// -- NodeJS ---------------------------------------------------------------- //
void encrypt (const v8::FunctionCallbackInfo<Value>& args) {
	/* plain/cipher text and key */
	string txt = "";
	string key = *String::Utf8Value(args[1]->ToString());

	/* retrieve buffer */
	v8::Local<Object> buffer     = args[0]->ToObject();
	char*             data       = node::Buffer::Data(buffer);
	size_t            size       = node::Buffer::Length(buffer);

	/* copy buffer data to c++ string */
	for (size_t i=0; i<size; i++)
		txt+=data[i];

	/* perform cipher */
	string res = fsl(txt, key);

	/* create a new buffer */
	Nan::MaybeLocal<v8::Object> result = Nan::CopyBuffer(&res[0], res.size());
	args.GetReturnValue().Set(result.ToLocalChecked());
}
void decrypt (const v8::FunctionCallbackInfo<Value>& args) {
    /* plain/cipher text and key */
    string txt = "";
    string key = *String::Utf8Value(args[1]->ToString());

    /* retrieve buffer */
    v8::Local<Object> buffer     = args[0]->ToObject();
    char*             data       = node::Buffer::Data(buffer);
    size_t            size       = node::Buffer::Length(buffer);

    /* copy buffer data to c++ string */
    for (size_t i=0; i<size; i++)
        txt+=data[i];

    /* perform cipher */
    string res = dap(fsl(txt, key));

    /* create a new buffer */
    Nan::MaybeLocal<v8::Object> result = Nan::CopyBuffer(&res[0], res.size());
    args.GetReturnValue().Set(result.ToLocalChecked());
}
void init(Local<Object> exports) {
	NODE_SET_METHOD(exports, "encrypt", encrypt);
    NODE_SET_METHOD(exports, "decrypt", decrypt);
}
NODE_MODULE(NODE_GYP_MODULE_NAME, init)