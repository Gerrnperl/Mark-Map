function generateMap(data) {
	console.log(data);
	let map = new AMap.Map('container', {
		viewMode: '3D',
		pitch: 55,
		zoom: 4,
		mapStyle: "amap://styles/51154e10df21344eda313bea0fa63270",
		center: [121.234746, 28.642774],
		features: ['bg', 'point']
	});
	window.map = map;
	// 设置光照
	// map.AmbientLight = new AMap.Lights.AmbientLight([1, 1, 1], 0.5);
	// map.DirectionLight = new AMap.Lights.DirectionLight([0, 0, 1], [1, 1, 1], 1);

	let object3Dlayer = new AMap.Object3DLayer();
	map.add(object3Dlayer);
	window.object3Dlayer = object3Dlayer;

	data.forEach((personalData, index) => {
		addPerson(personalData, index === data.length - 1, data);
	});
}

function addPerson(personalData, last = false, allData) {
	new AMap.DistrictSearch({
		subdistrict: 0,   //返回下一级行政区
		extensions: 'all',  //返回行政区边界坐标组等具体信息
		level: 'city'  //查询行政级别为 市
	}).search(personalData.city, function (status, result) {
		personalData.result = result.districtList[0];
		personalData.cityCode = result.districtList[0].adcode;
		if (last) {
			sortData(allData);
		}
	});
}

function sortData(data) {
	let sortedData = {};
	data.forEach((personalData) => {
		// 按城市划分
		if (!sortedData.hasOwnProperty(personalData.cityCode)) {
			sortedData[personalData.cityCode] = [];
		}
		sortedData[personalData.cityCode].push(personalData);
	});
	for (const cityCode in sortedData) {
		if (Object.hasOwnProperty.call(sortedData, cityCode)) {
			const cityData = sortedData[cityCode];
			console.log(cityData[0], cityData[0].result);
			if(!cityData[0].result){
				new Popup('warning', `查询[${cityData[0].city}]出错, 可能发生错误显示`);
			}
			setTimeout(() => {
				drawPersonsOfCity(cityData);
			}, 500);
		}
	}
}

function drawPersonsOfCity(cityData) {
	let bounds = cityData[0].result.boundaries;
	let height = 200000;
	let color = '#0078d4ee';
	let prism = new AMap.Object3D.Prism({
		path: bounds,
		height: height,
		color: color
	});

	prism.transparent = true;
	object3Dlayer.add(prism);
	
	let htmlText = 
		`<div class='city'>
			<div class='city-name'>
			${cityData[0].result.name}
			</div>
		`;
	cityData.forEach(personalData=>{
		if(personalData.cityCode !== cityData[0].cityCode){
			new Popup('warning', `查询[${personalData.city}]出错, 可能发生错误显示`);
		}
		htmlText += 
			`<div class='personal-data'>
				<details class='personal-details'>
					<summary class='name'>
						<div class='avatar'>
							<img src='${personalData.avatar}' />
						</div>	
						<div class='person-name'>
							${personalData.name}
						</div>
					</summary>
					${personalData.details}
				</details>
			</div>
			`
	})
	htmlText += `</div>`

	let text = new AMap.Text({
		// text: result.districtList[0].name + '</br>(' + result.districtList[0].adcode + ')',
		text: htmlText,
		verticalAlign: 'bottom',
		position: [cityData[0].result.center.lng, cityData[0].result.center.lat],
		height: 5000,
		style: {
			'background-color': 'transparent',
			'text-align': 'center',
			'border': 'none'
		}
	});

	text.setMap(map);
}