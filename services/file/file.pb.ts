// Code generated by protoc-gen-js-fetch.
// DO NOT EDIT!
import fetch, { Headers, RequestInit, Request } from 'node-fetch';

import * as apipb_messages from "./messages.pb";

export class FileMetadata {
	/**
	Key is the unique name of the file in collection
	*/
	key: string;
	/**
	Collection of the file, value can be asset, gameid or userid
	*/
	collection: string;
	/**
	Labels of the file. Label fields cannot be "key", "collection" and "type"
	*/
	labels: { [key: string]: string };
	/**
Type is Mime Type of the file
*/
	type: string;
	/**
	Checksum is MD5 of the file
	*/
	checksum: string;
	/**
	Owner of the file, if the value is empty means that its open to everyone
	*/
	owner: string;
	/**
	Url is the stored file url
	*/
	url: string;
}

export class UploadReq {
	/**
	Metadata list of upload files, keys have to be unique in the list
	*/
	metadata: FileMetadata[];
}

export class UploadRes {
	uploadUrls: { [key: string]: string };
}

export class StoreSmallReq {
	metadata: FileMetadata;
	data: string;
}

export class StoreRes {
	metadata: FileMetadata;
}

export class LookupReq {
	/**
	Selector the files. "key", "collection" and "type" also part of labels
	*/
	selector: apipb_messages.LabelSelector;
}

export class LookupRes {
	metadata: FileMetadata[];
}

export class FileService {
	private host: string;
	private headerEditors: any[] = [];
	/**
	 * @param {string} url the service host url
	 */
	constructor(url: string) {
		this.host = url;
		this.headerEditors = [];
	}

	addHeaderEditor(m: any) {
		this.headerEditors.push(m)
	}

	async requestStoreBig(uploadReq: UploadReq): Promise<UploadRes> {
		const _headers = new Headers();
		_headers.append("Content-Type", "application/json");
		for (let i = 0; i < this.headerEditors.length; ++i) {
			this.headerEditors[i].edit(_headers);
		}
		const _init = {
			method: 'POST',
			headers: _headers,
			body: JSON.stringify(uploadReq),
		} as RequestInit;

		const _req = new Request(`${this.host}/api/v1/file/big`, _init);
		try {
			const resp = await fetch(_req);
			return resp.json();
		} catch (err) {
			return Promise.reject(err);
		}
	}


	async lookup(lookupReq: LookupReq): Promise<LookupRes> {
		const _headers = new Headers();
		_headers.append("Content-Type", "application/json");
		for (let i = 0; i < this.headerEditors.length; ++i) {
			this.headerEditors[i].edit(_headers);
		}
		const _init = {
			method: 'POST',
			headers: _headers,
			body: JSON.stringify(lookupReq),
		} as RequestInit;

		const _req = new Request(`${this.host}/api/v1/file/lookup`, _init);
		try {
			const resp = await fetch(_req);
			return resp.json();
		} catch (err) {
			return Promise.reject(err);
		}
	}

}
