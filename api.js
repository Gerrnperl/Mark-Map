function log(key){
	let keyScript = document.createElement('script');
	keyScript.setAttribute('src', `//webapi.amap.com/maps?v=1.4.15&key=${key}&plugin=Map3D,AMap.DistrictSearch`);
	document.body.appendChild(keyScript);
	keyScript.addEventListener('load', async()=>{
		let data = await (await fetch('./data.json')).json();
		generateMap(data);
	})
}