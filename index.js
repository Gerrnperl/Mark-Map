const ENCRYPTED_secKey = '53daa4c486cae539a333f271de5246973d375b5092af243077100d4d3d3a057e';
const ENCRYPTED_key = '53dbaa9686cde631a461f72edf0745c53c34500596fb726521140a436c335d7e';

class Popup{

	/**
	 * 
	 * @param {'info' | 'warning' | 'error' | 'success' | 'confirm' | 'form'} type 
	 * @param {string | {}} content 
	 * @param {string} title 
	 */
	constructor(type, content, title){
		this.element = document.createElement('div');
		switch(type){
		case 'info':
		case 'warning':
		case 'error':
		case 'success':
			this.createToast(type, content);
			document.querySelector('#popup-container').appendChild(this.element);
			break;
		case 'confirm':
		case 'form':
			this.result = new Promise((resolve, reject) =>{
				this.createDialog(title, type, content).then(result => {
					resolve(result);
				});
			});
			document.querySelector('#popup-container').appendChild(this.element);
			break;
		}
	}


	close(){
		this.element.style.opacity = '0';
		setTimeout(() =>{
			document.querySelector('#popup-container').removeChild(this.element);
		}, 300);
	}

	/**
	 * 
	 * @param {'info' | 'warning' | 'error' | 'success'} type 
	 * @param {string} content 
	 */
	createToast(type, content){
		this.element.className = `popup toast ${type}`;
		this.element.innerHTML = content;
		setTimeout(() =>{
			this.element.style.opacity = '1';
		}, 0); // asynchronous execution
		setTimeout(() =>{
			this.element.style.opacity = '0';
			this.close();
		}, 3000);
	}

	/**
	 * if `type` is `confirm`, `content` should be string
	 * @param {string} title 
	 * @param {'confirm' | 'form'} type 
	 * @param {string | {}} content 
	 */
	createDialog(title, type, content){
		this.element.className = `popup dialog ${type}`;
		let dialogContent = document.createElement('div');

		dialogContent.className = 'dialog-content';
		let result;

		if(typeof content === 'string'){
			dialogContent.innerHTML = content;
		}
		else {
			result = {};
			for (const name in content){
				if (Object.hasOwnProperty.call(content, name)){
					const item = content[name];
					let label = document.createElement('label');

					label.innerHTML = `${item.label}`;
					let input = document.createElement('input');

					input.setAttribute('type', item.type || text);
					input.addEventListener('change', ()=>{
						result[name] = input.value;
					});
					let container = document.createElement('div');

					container.className = 'form-item';
					container.appendChild(label);
					container.appendChild(input);
					dialogContent.appendChild(container);
				}
			}
			// dialogContent
		}

		this.element.innerHTML = `
			<div class='dialog-title'>${title}</div>
			<div class='dialog-buttons'>	
				<button class='dialog-button button-confirm'>确定</button>
				<button class='dialog-button button-cancel'>取消</button>
			</div>
		`;

		this.element.insertBefore(dialogContent, this.element.querySelector('.dialog-buttons'));
		return new Promise((resolve, reject) => {
			if(type === 'confirm'){
				this.element.querySelector('.dialog-button.button-confirm').addEventListener('click', ()=>{
					resolve(true);
					this.close();
				});
				this.element.querySelector('.dialog-button.button-cancel').addEventListener('click', ()=>{
					reject(false);
					this.close();
				});
			}
			else{
				this.element.querySelector('.dialog-button.button-confirm').addEventListener('click', ()=>{
					resolve(result);
					this.close();
				});
				this.element.querySelector('.dialog-button.button-cancel').addEventListener('click', ()=>{
					reject(false);
					this.close();
				});
			}
		});
	}

}

function start(){
	let keyPopup = new Popup('form', {key: {
		label: '密钥',
		type: 'password',
	}},'请输入访问密钥');

	keyPopup.result.then(result=>{
		let keyArr = getKeyArray(result.key);
		if(keyArr.length !== 16){
			throw new Error('密钥长度不正确');
		}
		if(!testKey(keyArr)){
			throw new Error('密钥不正确');
		}
		let key = decrypt(keyArr, ENCRYPTED_key);
		let secKey = decrypt(keyArr, ENCRYPTED_secKey);

		if(key && secKey) {
			window._AMapSecurityConfig = {
				securityJsCode: secKey,
			}
			window.keyArr = keyArr;
			log(key);
		}

	}).catch((error)=>{
		new Popup('error', `失败: ${error}`);
		start();
	});
}

function getKeyArray(key){
	return key.split('').map((c,i)=>{
        return key.charCodeAt(i);
    }).join('').split('').map(n=>+n);
}

function testKey(keyArr){
	let encryptedHex = '23daf19e8b8bd36ee33ea7';
	let decryptedText = decrypt(keyArr, encryptedHex);
	console.log(decryptedText);
	return decryptedText === 'Hello World';
}

function encrypt(keyArr, text){
	let textBytes = new TextEncoder().encode(text);
	let aesCtr = new aesjs.ModeOfOperation.ctr(keyArr);
	let encryptedBytes = aesCtr.encrypt(textBytes);
	let encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
	return encryptedHex;
}

function decrypt(keyArr, text){
	let encryptedBytes = aesjs.utils.hex.toBytes(text);
	let aesCtr = new aesjs.ModeOfOperation.ctr(keyArr);
	let decryptedBytes = aesCtr.decrypt(encryptedBytes);
	let decryptedText = new TextDecoder().decode(decryptedBytes);
	return decryptedText;
}

function log(key){
	let keyScript = document.createElement('script');
	keyScript.setAttribute('src', `//webapi.amap.com/maps?v=1.4.15&key=${key}&plugin=Map3D,AMap.DistrictSearch`);
	document.body.appendChild(keyScript);
	keyScript.addEventListener('load', async()=>{
		try{
			let encrypted_data = await (await fetch('./data.json.enc')).text();
			let data = decrypt(keyArr, encrypted_data);
			console.log(data);
			let dataObj = JSON.parse(data);
			generateMap(dataObj);
		}
		catch(error){
			new Popup('error', `失败: ${error}`);
		}
	})
}


start();