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
#include <unistd.h>
#include <pthread.h>
#include <node.h>
#include "node_modules/nan/nan.h"

//// STL ///////////////
using std::cin;       //
using std::cout;      //
using std::endl;      //
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
#define ROUNDS       32U   // Number of rounds that are performed
#define BLOCKSIZE    32U   // (64 bits) Block size of the cipher
#undef  DBUG_SPLIT         // Disable debug block
#undef  DBUG_SPAWN         // Disable debug block
#undef  DBUG_JOIN          // Disable debug block
#undef  DBUG_DELETE        // Disable debug block
#undef  DBUG_INIT          // Disable debug block
#undef  DBUG_COMP          // Disable debug block
#undef  DBUG_INPUT         // Disable debug block

// -- Constants ------------------------------------------------------------- //
const int Threads = sysconf(_SC_NPROCESSORS_ONLN);  // Heavily platform specific

// -- Type Definitions ------------------------------------------------------ //
typedef   uint64_t   u64;
typedef   uint32_t   u32;
typedef    int64_t   i64;
typedef          __int128  i128;
typedef unsigned __int128  u128;

// -- Structs --------------------------------------------------------------- //
/* this struct is used to pass block indexes to worker threads */
typedef struct threadman {
    u32 id;       // Identifier
    u64 sb;       // Index of the starting block
    u64 bc;       // Number of blocks to process
    string *txt;  // Text to cipher
    string *key;  // Key used during cipher process
} threadman;

// -- Prototypes ------------------------------------------------------------ //
u128    s2u (string i);      // convert string to unsigned 64
string  u2s (u128 i, u64 s); // convert unsigned 64 to string
string  pad (string txt);    // Returns text evenly divisible by BLOCKSIZE
string  dap (string txt);    // Returns text that strips padding
string  rnd (string blk, string key);          // Rounding function
string  fsl_master (string txt, string key);   // Feistel cipher main thread
void    *fsl_slave (void *winning);            // Feistel cipher worker threads

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
string fsl_master (string txt, string key) {
    /*
     * ptxt  padded plain text
     * blks  number of blocks
     * ctxt  the resulting ciphertext to return
     */
    string *ptxt = new string(pad(txt));
    string *pkey = new string(key);
    u64    blks = ptxt->size() / BLOCKSIZE;
    string ctxt = "";

    /* stores references to threads */
    pthread_t workers[Threads];
    threadman *tasks = new threadman[Threads];
    void *results[Threads];

    /* divide the work */
    #ifdef DBUG_SPLIT
    cout << "Dividing work:"       << "\n"
         << "\tNumBlocks=" << blks << endl;
    #endif
    u32 chunks  = max(blks/Threads, (u64) 1);
    u32 current = 0;
    u32 i = 0;
    for (; i < (u32) Threads; i++) {
        (tasks+i)->id = i;
        /* assign start index */
        (tasks+i)->sb = current;
        /* compute number of blocks */
        if (current >= blks)
            break;
        else if (current+chunks >= blks || i+1 == (u32) Threads) {
            (tasks+i)->bc = blks-current;
            current = blks;
        }
        else {
            (tasks+i)->bc = chunks;
            current+=chunks;
        }
        /* assign txt pointers */
        (tasks+i)->txt = ptxt;
        (tasks+i)->key = pkey;
        /* create thread */
        #ifdef DBUG_SPAWN
        cout << "Spawning thread:"           << "\n"
             << "\tId   =" << (tasks+i)->id  << "\n"
             << "\tStart=" << (tasks+i)->sb  << "\n"
             << "\tCount=" << (tasks+i)->bc  << std::endl;
        #endif
        pthread_create(&workers[i], NULL, fsl_slave, (void*) (tasks+i));
    }

    /* join on threads */
    for (u32 j=0; j<i; j++) {
        #ifdef DBUG_JOIN
        cout << "Joining on thread:" << "\n"
             << "\tId=" << j         << endl;
        #endif
        pthread_join(workers[j], &results[j]);
    }
    /* concatenate and free data */
    #ifdef DBUG_DELETE
        cout << "Freeing heap..." << endl;
    #endif
    for (u32 j=0; j<i; j++) {
        ctxt += *((string*) results[j]);
        delete    (string*) results[j];
    }
    delete[] tasks;
    delete   pkey;
    delete   ptxt;
    return ctxt;
}
void *fsl_slave (void *winning) {
    #ifdef DBUG_INIT
    cout << "Thread spawned: "                    << "\n"
         << "\tId=" << ((threadman*) winning)->id << endl;
    #endif

    u64 indx = ((threadman*) winning)->sb * BLOCKSIZE;
    u64 blks = ((threadman*) winning)->bc;
    string ptxt  = *(((threadman*) winning)->txt);
    string key   = *(((threadman*) winning)->key);
    string *ctxt = new string("");

    #ifdef DBUG_COMP
    cout << "Thread starting computation"            << "\n"
         << "\tId="    << ((threadman*) winning)->id << "\n"
         << "\tStart=" << indx                       << "\n"
         << "\tCount=" << blks                       << "\n"
         << "\tText =" << ptxt                       << "\n"
         << "\tKey  =" << key                        << endl;
    #endif

    /* implement fiestel cipher */
    for (u64 i = 0; i < blks; i++) {
        /* calculate and assign block halves */
        u128 pos = i*32 + indx;
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
        *ctxt += r+l;
    }
    return (void*) ctxt;
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

    #ifdef DBUG_INPUT
    cout << "Starting encryption process:" << "\n"
         << "\tText=" << txt               << "\n"
         << "\tKey =" << key               << endl;
    #endif

    /* perform cipher */
    string res = fsl_master(txt, key);

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

    #ifdef DBUG_INPUT
    cout << "Starting decryption process:" << "\n"
         << "\tText=" << txt               << "\n"
         << "\tKey =" << key               << endl;
    #endif

    /* perform cipher */
    string res = dap(fsl_master(txt, key));

    /* create a new buffer */
    Nan::MaybeLocal<v8::Object> result = Nan::CopyBuffer(&res[0], res.size());
    args.GetReturnValue().Set(result.ToLocalChecked());
}
void init(Local<Object> exports) {
    NODE_SET_METHOD(exports, "encrypt", encrypt);
    NODE_SET_METHOD(exports, "decrypt", decrypt);
}
NODE_MODULE(NODE_GYP_MODULE_NAME, init)