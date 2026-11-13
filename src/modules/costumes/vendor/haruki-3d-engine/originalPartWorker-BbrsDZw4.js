import { D as e, O as t, w as n } from "./unityPrefabRuntime-CWVh8HCp.js";
import { D as r, O as i, c as a, k as o, l as s } from "./mirrorContent-CeWarGlB.js";
new TextEncoder();
var c = 4096;
function l(e, t, n) {
	let r = t, i = r + n, a = [], o = "";
	for (; r < i;) {
		let t = e[r++];
		if (!(t & 128)) a.push(t);
		else if ((t & 224) == 192) {
			let n = e[r++] & 63;
			a.push((t & 31) << 6 | n);
		} else if ((t & 240) == 224) {
			let n = e[r++] & 63, i = e[r++] & 63;
			a.push((t & 31) << 12 | n << 6 | i);
		} else if ((t & 248) == 240) {
			let n = e[r++] & 63, i = e[r++] & 63, o = e[r++] & 63, s = (t & 7) << 18 | n << 12 | i << 6 | o;
			s > 65535 && (s -= 65536, a.push(s >>> 10 & 1023 | 55296), s = 56320 | s & 1023), a.push(s);
		} else a.push(t);
		a.length >= c && (o += String.fromCharCode(...a), a.length = 0);
	}
	return a.length > 0 && (o += String.fromCharCode(...a)), o;
}
var ee = new TextDecoder(), te = 200;
function ne(e, t, n) {
	let r = e.subarray(t, t + n);
	return ee.decode(r);
}
function u(e, t, n) {
	return n > te ? ne(e, t, n) : l(e, t, n);
}
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/ExtData.mjs
var d = class {
	type;
	data;
	constructor(e, t) {
		this.type = e, this.data = t;
	}
}, f = class e extends Error {
	constructor(t) {
		super(t);
		let n = Object.create(e.prototype);
		Object.setPrototypeOf(this, n), Object.defineProperty(this, "name", {
			configurable: !0,
			enumerable: !1,
			value: e.name
		});
	}
};
function p(e, t, n) {
	let r = Math.floor(n / 4294967296), i = n;
	e.setUint32(t, r), e.setUint32(t + 4, i);
}
function m(e, t) {
	let n = e.getInt32(t), r = e.getUint32(t + 4);
	return n * 4294967296 + r;
}
function re(e, t) {
	let n = e.getUint32(t), r = e.getUint32(t + 4);
	return n * 4294967296 + r;
}
var ie = 4294967295, ae = 17179869183;
function h({ sec: e, nsec: t }) {
	if (e >= 0 && t >= 0 && e <= ae) if (t === 0 && e <= ie) {
		let t = /* @__PURE__ */ new Uint8Array(4);
		return new DataView(t.buffer).setUint32(0, e), t;
	} else {
		let n = e / 4294967296, r = e & 4294967295, i = /* @__PURE__ */ new Uint8Array(8), a = new DataView(i.buffer);
		return a.setUint32(0, t << 2 | n & 3), a.setUint32(4, r), i;
	}
	else {
		let n = /* @__PURE__ */ new Uint8Array(12), r = new DataView(n.buffer);
		return r.setUint32(0, t), p(r, 4, e), n;
	}
}
function g(e) {
	let t = e.getTime(), n = Math.floor(t / 1e3), r = (t - n * 1e3) * 1e6, i = Math.floor(r / 1e9);
	return {
		sec: n + i,
		nsec: r - i * 1e9
	};
}
function oe(e) {
	return e instanceof Date ? h(g(e)) : null;
}
function _(e) {
	let t = new DataView(e.buffer, e.byteOffset, e.byteLength);
	switch (e.byteLength) {
		case 4: return {
			sec: t.getUint32(0),
			nsec: 0
		};
		case 8: {
			let e = t.getUint32(0), n = t.getUint32(4);
			return {
				sec: (e & 3) * 4294967296 + n,
				nsec: e >>> 2
			};
		}
		case 12: return {
			sec: m(t, 4),
			nsec: t.getUint32(0)
		};
		default: throw new f(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${e.length}`);
	}
}
function v(e) {
	let t = _(e);
	return /* @__PURE__ */ new Date(t.sec * 1e3 + t.nsec / 1e6);
}
var y = {
	type: -1,
	encode: oe,
	decode: v
}, b = class e {
	static defaultCodec = new e();
	__brand;
	builtInEncoders = [];
	builtInDecoders = [];
	encoders = [];
	decoders = [];
	constructor() {
		this.register(y);
	}
	register({ type: e, encode: t, decode: n }) {
		if (e >= 0) this.encoders[e] = t, this.decoders[e] = n;
		else {
			let r = -1 - e;
			this.builtInEncoders[r] = t, this.builtInDecoders[r] = n;
		}
	}
	tryToEncode(e, t) {
		for (let n = 0; n < this.builtInEncoders.length; n++) {
			let r = this.builtInEncoders[n];
			if (r != null) {
				let i = r(e, t);
				if (i != null) return new d(-1 - n, i);
			}
		}
		for (let n = 0; n < this.encoders.length; n++) {
			let r = this.encoders[n];
			if (r != null) {
				let i = r(e, t);
				if (i != null) return new d(n, i);
			}
		}
		return e instanceof d ? e : null;
	}
	decode(e, t, n) {
		let r = t < 0 ? this.builtInDecoders[-1 - t] : this.decoders[t];
		return r ? r(e, t, n) : new d(t, e);
	}
};
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/utils/typedArrays.mjs
function se(e) {
	return e instanceof ArrayBuffer || typeof SharedArrayBuffer < "u" && e instanceof SharedArrayBuffer;
}
function x(e) {
	return e instanceof Uint8Array ? e : ArrayBuffer.isView(e) ? new Uint8Array(e.buffer, e.byteOffset, e.byteLength) : se(e) ? new Uint8Array(e) : Uint8Array.from(e);
}
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/utils/prettyByte.mjs
function S(e) {
	return `${e < 0 ? "-" : ""}0x${Math.abs(e).toString(16).padStart(2, "0")}`;
}
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/CachedKeyDecoder.mjs
var ce = 16, le = 16, ue = class {
	hit = 0;
	miss = 0;
	caches;
	maxKeyLength;
	maxLengthPerKey;
	constructor(e = ce, t = le) {
		this.maxKeyLength = e, this.maxLengthPerKey = t, this.caches = [];
		for (let e = 0; e < this.maxKeyLength; e++) this.caches.push([]);
	}
	canBeCached(e) {
		return e > 0 && e <= this.maxKeyLength;
	}
	find(e, t, n) {
		let r = this.caches[n - 1];
		FIND_CHUNK: for (let i of r) {
			let r = i.bytes;
			for (let i = 0; i < n; i++) if (r[i] !== e[t + i]) continue FIND_CHUNK;
			return i.str;
		}
		return null;
	}
	store(e, t) {
		let n = this.caches[e.length - 1], r = {
			bytes: e,
			str: t
		};
		n.length >= this.maxLengthPerKey ? n[Math.random() * n.length | 0] = r : n.push(r);
	}
	decode(e, t, n) {
		let r = this.find(e, t, n);
		if (r != null) return this.hit++, r;
		this.miss++;
		let i = l(e, t, n), a = Uint8Array.prototype.slice.call(e, t, t + n);
		return this.store(a, i), i;
	}
}, C = "array", w = "map_key", T = "map_value", E = (e) => {
	if (typeof e == "string" || typeof e == "number") return e;
	throw new f("The type of key must be string or number but " + typeof e);
}, D = class {
	stack = [];
	stackHeadPosition = -1;
	get length() {
		return this.stackHeadPosition + 1;
	}
	top() {
		return this.stack[this.stackHeadPosition];
	}
	pushArrayState(e) {
		let t = this.getUninitializedStateFromPool();
		t.type = C, t.position = 0, t.size = e, t.array = Array(e);
	}
	pushMapState(e) {
		let t = this.getUninitializedStateFromPool();
		t.type = w, t.readCount = 0, t.size = e, t.map = {};
	}
	getUninitializedStateFromPool() {
		return this.stackHeadPosition++, this.stackHeadPosition === this.stack.length && this.stack.push({
			type: void 0,
			size: 0,
			array: void 0,
			position: 0,
			readCount: 0,
			map: void 0,
			key: null
		}), this.stack[this.stackHeadPosition];
	}
	release(e) {
		if (this.stack[this.stackHeadPosition] !== e) throw Error("Invalid stack state. Released state is not on top of the stack.");
		if (e.type === C) {
			let t = e;
			t.size = 0, t.array = void 0, t.position = 0, t.type = void 0;
		}
		if (e.type === w || e.type === T) {
			let t = e;
			t.size = 0, t.map = void 0, t.readCount = 0, t.type = void 0;
		}
		this.stackHeadPosition--;
	}
	reset() {
		this.stack.length = 0, this.stackHeadPosition = -1;
	}
}, O = -1, k = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(0)), A = new Uint8Array(k.buffer);
try {
	k.getInt8(0);
} catch (e) {
	if (!(e instanceof RangeError)) throw Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access");
}
var j = /* @__PURE__ */ RangeError("Insufficient data"), M = new ue(), N = class e {
	extensionCodec;
	context;
	useBigInt64;
	rawStrings;
	maxStrLength;
	maxBinLength;
	maxArrayLength;
	maxMapLength;
	maxExtLength;
	keyDecoder;
	mapKeyConverter;
	totalPos = 0;
	pos = 0;
	view = k;
	bytes = A;
	headByte = O;
	stack = new D();
	entered = !1;
	constructor(e) {
		this.extensionCodec = e?.extensionCodec ?? b.defaultCodec, this.context = e?.context, this.useBigInt64 = e?.useBigInt64 ?? !1, this.rawStrings = e?.rawStrings ?? !1, this.maxStrLength = e?.maxStrLength ?? 4294967295, this.maxBinLength = e?.maxBinLength ?? 4294967295, this.maxArrayLength = e?.maxArrayLength ?? 4294967295, this.maxMapLength = e?.maxMapLength ?? 4294967295, this.maxExtLength = e?.maxExtLength ?? 4294967295, this.keyDecoder = e?.keyDecoder === void 0 ? M : e.keyDecoder, this.mapKeyConverter = e?.mapKeyConverter ?? E;
	}
	clone() {
		return new e({
			extensionCodec: this.extensionCodec,
			context: this.context,
			useBigInt64: this.useBigInt64,
			rawStrings: this.rawStrings,
			maxStrLength: this.maxStrLength,
			maxBinLength: this.maxBinLength,
			maxArrayLength: this.maxArrayLength,
			maxMapLength: this.maxMapLength,
			maxExtLength: this.maxExtLength,
			keyDecoder: this.keyDecoder
		});
	}
	reinitializeState() {
		this.totalPos = 0, this.headByte = O, this.stack.reset();
	}
	setBuffer(e) {
		let t = x(e);
		this.bytes = t, this.view = new DataView(t.buffer, t.byteOffset, t.byteLength), this.pos = 0;
	}
	appendBuffer(e) {
		if (this.headByte === O && !this.hasRemaining(1)) this.setBuffer(e);
		else {
			let t = this.bytes.subarray(this.pos), n = x(e), r = new Uint8Array(t.length + n.length);
			r.set(t), r.set(n, t.length), this.setBuffer(r);
		}
	}
	hasRemaining(e) {
		return this.view.byteLength - this.pos >= e;
	}
	createExtraByteError(e) {
		let { view: t, pos: n } = this;
		return /* @__PURE__ */ RangeError(`Extra ${t.byteLength - n} of ${t.byteLength} byte(s) found at buffer[${e}]`);
	}
	decode(e) {
		if (this.entered) return this.clone().decode(e);
		try {
			this.entered = !0, this.reinitializeState(), this.setBuffer(e);
			let t = this.doDecodeSync();
			if (this.hasRemaining(1)) throw this.createExtraByteError(this.pos);
			return t;
		} finally {
			this.entered = !1;
		}
	}
	*decodeMulti(e) {
		if (this.entered) {
			yield* this.clone().decodeMulti(e);
			return;
		}
		try {
			for (this.entered = !0, this.reinitializeState(), this.setBuffer(e); this.hasRemaining(1);) yield this.doDecodeSync();
		} finally {
			this.entered = !1;
		}
	}
	async decodeAsync(e) {
		if (this.entered) return this.clone().decodeAsync(e);
		try {
			this.entered = !0;
			let t = !1, n;
			for await (let r of e) {
				if (t) throw this.entered = !1, this.createExtraByteError(this.totalPos);
				this.appendBuffer(r);
				try {
					n = this.doDecodeSync(), t = !0;
				} catch (e) {
					if (!(e instanceof RangeError)) throw e;
				}
				this.totalPos += this.pos;
			}
			if (t) {
				if (this.hasRemaining(1)) throw this.createExtraByteError(this.totalPos);
				return n;
			}
			let { headByte: r, pos: i, totalPos: a } = this;
			throw RangeError(`Insufficient data in parsing ${S(r)} at ${a} (${i} in the current buffer)`);
		} finally {
			this.entered = !1;
		}
	}
	decodeArrayStream(e) {
		return this.decodeMultiAsync(e, !0);
	}
	decodeStream(e) {
		return this.decodeMultiAsync(e, !1);
	}
	async *decodeMultiAsync(e, t) {
		if (this.entered) {
			yield* this.clone().decodeMultiAsync(e, t);
			return;
		}
		try {
			this.entered = !0;
			let n = t, r = -1;
			for await (let i of e) {
				if (t && r === 0) throw this.createExtraByteError(this.totalPos);
				this.appendBuffer(i), n && (r = this.readArraySize(), n = !1, this.complete());
				try {
					for (; yield this.doDecodeSync(), --r !== 0;);
				} catch (e) {
					if (!(e instanceof RangeError)) throw e;
				}
				this.totalPos += this.pos;
			}
		} finally {
			this.entered = !1;
		}
	}
	doDecodeSync() {
		DECODE: for (;;) {
			let e = this.readHeadByte(), t;
			if (e >= 224) t = e - 256;
			else if (e < 192) if (e < 128) t = e;
			else if (e < 144) {
				let n = e - 128;
				if (n !== 0) {
					this.pushMapState(n), this.complete();
					continue DECODE;
				} else t = {};
			} else if (e < 160) {
				let n = e - 144;
				if (n !== 0) {
					this.pushArrayState(n), this.complete();
					continue DECODE;
				} else t = [];
			} else {
				let n = e - 160;
				t = this.decodeString(n, 0);
			}
			else if (e === 192) t = null;
			else if (e === 194) t = !1;
			else if (e === 195) t = !0;
			else if (e === 202) t = this.readF32();
			else if (e === 203) t = this.readF64();
			else if (e === 204) t = this.readU8();
			else if (e === 205) t = this.readU16();
			else if (e === 206) t = this.readU32();
			else if (e === 207) t = this.useBigInt64 ? this.readU64AsBigInt() : this.readU64();
			else if (e === 208) t = this.readI8();
			else if (e === 209) t = this.readI16();
			else if (e === 210) t = this.readI32();
			else if (e === 211) t = this.useBigInt64 ? this.readI64AsBigInt() : this.readI64();
			else if (e === 217) {
				let e = this.lookU8();
				t = this.decodeString(e, 1);
			} else if (e === 218) {
				let e = this.lookU16();
				t = this.decodeString(e, 2);
			} else if (e === 219) {
				let e = this.lookU32();
				t = this.decodeString(e, 4);
			} else if (e === 220) {
				let e = this.readU16();
				if (e !== 0) {
					this.pushArrayState(e), this.complete();
					continue DECODE;
				} else t = [];
			} else if (e === 221) {
				let e = this.readU32();
				if (e !== 0) {
					this.pushArrayState(e), this.complete();
					continue DECODE;
				} else t = [];
			} else if (e === 222) {
				let e = this.readU16();
				if (e !== 0) {
					this.pushMapState(e), this.complete();
					continue DECODE;
				} else t = {};
			} else if (e === 223) {
				let e = this.readU32();
				if (e !== 0) {
					this.pushMapState(e), this.complete();
					continue DECODE;
				} else t = {};
			} else if (e === 196) {
				let e = this.lookU8();
				t = this.decodeBinary(e, 1);
			} else if (e === 197) {
				let e = this.lookU16();
				t = this.decodeBinary(e, 2);
			} else if (e === 198) {
				let e = this.lookU32();
				t = this.decodeBinary(e, 4);
			} else if (e === 212) t = this.decodeExtension(1, 0);
			else if (e === 213) t = this.decodeExtension(2, 0);
			else if (e === 214) t = this.decodeExtension(4, 0);
			else if (e === 215) t = this.decodeExtension(8, 0);
			else if (e === 216) t = this.decodeExtension(16, 0);
			else if (e === 199) {
				let e = this.lookU8();
				t = this.decodeExtension(e, 1);
			} else if (e === 200) {
				let e = this.lookU16();
				t = this.decodeExtension(e, 2);
			} else if (e === 201) {
				let e = this.lookU32();
				t = this.decodeExtension(e, 4);
			} else throw new f(`Unrecognized type byte: ${S(e)}`);
			this.complete();
			let n = this.stack;
			for (; n.length > 0;) {
				let e = n.top();
				if (e.type === C) if (e.array[e.position] = t, e.position++, e.position === e.size) t = e.array, n.release(e);
				else continue DECODE;
				else if (e.type === w) {
					if (t === "__proto__") throw new f("The key __proto__ is not allowed");
					e.key = this.mapKeyConverter(t), e.type = T;
					continue DECODE;
				} else if (e.map[e.key] = t, e.readCount++, e.readCount === e.size) t = e.map, n.release(e);
				else {
					e.key = null, e.type = w;
					continue DECODE;
				}
			}
			return t;
		}
	}
	readHeadByte() {
		return this.headByte === O && (this.headByte = this.readU8()), this.headByte;
	}
	complete() {
		this.headByte = O;
	}
	readArraySize() {
		let e = this.readHeadByte();
		switch (e) {
			case 220: return this.readU16();
			case 221: return this.readU32();
			default:
				if (e < 160) return e - 144;
				throw new f(`Unrecognized array type byte: ${S(e)}`);
		}
	}
	pushMapState(e) {
		if (e > this.maxMapLength) throw new f(`Max length exceeded: map length (${e}) > maxMapLengthLength (${this.maxMapLength})`);
		this.stack.pushMapState(e);
	}
	pushArrayState(e) {
		if (e > this.maxArrayLength) throw new f(`Max length exceeded: array length (${e}) > maxArrayLength (${this.maxArrayLength})`);
		this.stack.pushArrayState(e);
	}
	decodeString(e, t) {
		return !this.rawStrings || this.stateIsMapKey() ? this.decodeUtf8String(e, t) : this.decodeBinary(e, t);
	}
	decodeUtf8String(e, t) {
		if (e > this.maxStrLength) throw new f(`Max length exceeded: UTF-8 byte length (${e}) > maxStrLength (${this.maxStrLength})`);
		if (this.bytes.byteLength < this.pos + t + e) throw j;
		let n = this.pos + t, r;
		return r = this.stateIsMapKey() && this.keyDecoder?.canBeCached(e) ? this.keyDecoder.decode(this.bytes, n, e) : u(this.bytes, n, e), this.pos += t + e, r;
	}
	stateIsMapKey() {
		return this.stack.length > 0 && this.stack.top().type === w;
	}
	decodeBinary(e, t) {
		if (e > this.maxBinLength) throw new f(`Max length exceeded: bin length (${e}) > maxBinLength (${this.maxBinLength})`);
		if (!this.hasRemaining(e + t)) throw j;
		let n = this.pos + t, r = this.bytes.subarray(n, n + e);
		return this.pos += t + e, r;
	}
	decodeExtension(e, t) {
		if (e > this.maxExtLength) throw new f(`Max length exceeded: ext length (${e}) > maxExtLength (${this.maxExtLength})`);
		let n = this.view.getInt8(this.pos + t), r = this.decodeBinary(e, t + 1);
		return this.extensionCodec.decode(r, n, this.context);
	}
	lookU8() {
		return this.view.getUint8(this.pos);
	}
	lookU16() {
		return this.view.getUint16(this.pos);
	}
	lookU32() {
		return this.view.getUint32(this.pos);
	}
	readU8() {
		let e = this.view.getUint8(this.pos);
		return this.pos++, e;
	}
	readI8() {
		let e = this.view.getInt8(this.pos);
		return this.pos++, e;
	}
	readU16() {
		let e = this.view.getUint16(this.pos);
		return this.pos += 2, e;
	}
	readI16() {
		let e = this.view.getInt16(this.pos);
		return this.pos += 2, e;
	}
	readU32() {
		let e = this.view.getUint32(this.pos);
		return this.pos += 4, e;
	}
	readI32() {
		let e = this.view.getInt32(this.pos);
		return this.pos += 4, e;
	}
	readU64() {
		let e = re(this.view, this.pos);
		return this.pos += 8, e;
	}
	readI64() {
		let e = m(this.view, this.pos);
		return this.pos += 8, e;
	}
	readU64AsBigInt() {
		let e = this.view.getBigUint64(this.pos);
		return this.pos += 8, e;
	}
	readI64AsBigInt() {
		let e = this.view.getBigInt64(this.pos);
		return this.pos += 8, e;
	}
	readF32() {
		let e = this.view.getFloat32(this.pos);
		return this.pos += 4, e;
	}
	readF64() {
		let e = this.view.getFloat64(this.pos);
		return this.pos += 8, e;
	}
};
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/decode.mjs
function P(e, t) {
	return new N(t).decode(e);
}
//#endregion
//#region src/original/originalBundleStore.ts
function F(e, t) {
	if (!e) throw Error(t);
}
var I = [
	85,
	110,
	105,
	116,
	121,
	70,
	83,
	0
], L = (e, t = 0) => I.every((n, r) => e[t + r] === n);
function R(e, t) {
	if (L(e)) return e;
	let n = e[0];
	F(e.length > 4 && (n === 16 || n === 32) && e[1] === 0 && e[2] === 0 && e[3] === 0, `original bundle ${t} is neither UnityFS nor an encrypted game bundle`);
	let r = e.subarray(4);
	if (n === 16 && r.length >= 128) for (let e = 0; e < 128; e++) (e & 7) < 5 && (r[e] ^= 255);
	return F(L(r), `original bundle ${t} has header 0x${n.toString(16)} but does not decrypt to UnityFS`), r;
}
function z(e) {
	let t = e.find((e) => e !== 32 && e !== 10 && e !== 13 && e !== 9) === 123 ? JSON.parse(new TextDecoder().decode(e)) : P(e);
	return F(t && typeof t.bundles == "object" && t.bundles, "AssetBundleInfo has no bundles"), {
		version: String(t.version ?? ""),
		bundles: new Map(Object.entries(t.bundles))
	};
}
var B = class {
	host;
	cacheBytes;
	read;
	catalogPromise = null;
	open = /* @__PURE__ */ new Map();
	sizes = /* @__PURE__ */ new Map();
	byCabName = /* @__PURE__ */ new Map();
	total = 0;
	constructor(e, n = 384 * 1024 * 1024, r = (e, n) => new t(e, n)) {
		this.host = e, this.cacheBytes = n, this.read = r;
	}
	catalog() {
		if (!this.catalogPromise) {
			let e = this.host.catalog().then(z);
			this.catalogPromise = e, e.catch(() => {
				this.catalogPromise === e && (this.catalogPromise = null);
			});
		}
		return this.catalogPromise;
	}
	async has(e) {
		return (await this.catalog()).bundles.has(e);
	}
	byCab(e) {
		return this.byCabName.get(e) ?? null;
	}
	async load(e) {
		let t = await this.loadOne(e);
		return await Promise.all(t.assetBundle.m_Dependencies.map((e) => this.load(e))), t;
	}
	loadOne(e) {
		let t = this.open.get(e);
		return t ? (this.open.delete(e), this.open.set(e, t), t) : (t = (async () => {
			let t = await this.catalog(), n = t.bundles.get(e);
			F(n, `original bundle ${e} is not in the AssetBundleInfo`);
			let r = R(await this.host.bundle(n, t.version), e), i = this.read(e, r);
			return this.byCabName.set(i.cabName, i), this.sizes.set(e, i.size), this.total += i.size, this.evict(e), i;
		})(), this.open.set(e, t), t.catch(() => this.open.delete(e)), t);
	}
	evict(e) {
		for (let t of this.open.keys()) {
			if (this.total <= this.cacheBytes) break;
			let n = this.sizes.get(t);
			t === e || t === "shader/live" || n === void 0 || (this.open.get(t).then((e) => {
				this.byCabName.get(e.cabName) === e && this.byCabName.delete(e.cabName);
			}), this.open.delete(t), this.sizes.delete(t), this.total -= n);
		}
	}
}, V = /* @__PURE__ */ new Map();
function H(e, t) {
	V.set(e, t);
}
var de = 1, U = /* @__PURE__ */ new Map();
function W(e, t, n, r) {
	let i = de++;
	return new Promise((a, o) => {
		U.set(i, {
			resolve: a,
			reject: o
		}), self.postMessage({
			hostRequest: i,
			contentId: e,
			what: t,
			element: n,
			version: r
		});
	});
}
var G = /* @__PURE__ */ new Map();
function K(e) {
	let t = G.get(e);
	return t || (t = new B(V.get(e) ?? {
		catalog: () => W(e, "catalog"),
		bundle: (t, n) => W(e, "bundle", t, n)
	}), G.set(e, t)), t;
}
function q(e) {
	G.delete(e), V.delete(e);
}
async function J(t) {
	let n = K(t.contentId), r = {};
	return await Promise.all(t.bundleNames.map(async (t) => {
		if (!await n.has(t)) {
			r[t] = null;
			return;
		}
		let i = await n.load(t);
		r[t] = i.assetBundle.m_Container.map((e) => i.object(e.second.asset.m_PathID)).filter((t) => t?.classId === e.AnimationClip).map((e) => s(e.read()));
	})), { clips: r };
}
async function Y(e) {
	let t = await K(e.contentId).catalog(), n = r(e.common, e.character, e.characterId, e.unit, (e) => t.bundles.has(e));
	return { roleIndex: {
		...n,
		masterVersion: n.masterVersion || t.version
	} };
}
async function X(e) {
	let t = await K(e.contentId).catalog(), n = i(e.common, e.gameCharacterId, e.unit);
	return { bundleName: o(e.common, n, e.motionType, (e) => t.bundles.has(e)) };
}
async function Z(e) {
	let t = K(e.contentId), [r, i] = await Promise.all([t.load(e.bundleName), e.colorBundleName ? t.load(e.colorBundleName) : Promise.resolve(null)]), o = a({
		entry: e.entry,
		partType: e.partType,
		bundle: r,
		colorBundle: i,
		resolveBundle: (e) => t.byCab(e),
		attachNode: e.attachNode
	}), s = {};
	for (let e of o.materialSlots ?? []) for (let r of e.rawMaterial.textureProperties) {
		if (!r.uri || s[r.uri]) continue;
		let e = /^original:([^:]+):(-?\d+)$/.exec(r.uri), i = t.byCab(e[1]);
		if (!i) throw Error(`texture bundle ${e[1]} is not loaded`);
		s[r.uri] = n(i, BigInt(e[2]));
	}
	return {
		runtime: o,
		textures: s
	};
}
function Q(e) {
	switch (e.kind) {
		case "part": return Z(e);
		case "clips": return J(e);
		case "roleIndex": return Y(e);
		case "motionName": return X(e);
	}
}
function $(e, t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set()) {
	if (!e || typeof e != "object") return t;
	if (ArrayBuffer.isView(e)) return e.buffer instanceof ArrayBuffer && e.byteOffset === 0 && e.byteLength === e.buffer.byteLength && e.byteLength > 0 && t.add(e.buffer), t;
	if (n.has(e)) return t;
	n.add(e);
	for (let r of Array.isArray(e) ? e : Object.values(e)) $(r, t, n);
	return t;
}
typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope && (self.onmessage = async (e) => {
	let t = e.data;
	if ("hostResponse" in t) {
		let e = U.get(t.hostResponse);
		U.delete(t.hostResponse), t.error !== void 0 || !t.bytes ? e?.reject(Error(t.error ?? "no bytes")) : e?.resolve(new Uint8Array(t.bytes));
		return;
	}
	if ("release" in t) {
		q(t.release);
		return;
	}
	let { id: n, ...r } = t;
	try {
		let e = await Q(r);
		self.postMessage({
			id: n,
			...e
		}, [...$(e)]);
	} catch (e) {
		self.postMessage({
			id: n,
			error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e)
		});
	}
});
//#endregion
export { Z as buildOriginalPartRequest, J as loadOriginalClipsRequest, Y as loadOriginalRoleIndexRequest, H as registerOriginalHost, q as releaseOriginalContent, X as resolveOriginalMotionNameRequest, Q as runOriginalWorkerRequest };
