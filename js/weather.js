function watherHandler (weather) {
	//返回时间段
	var returnTime=function(){
		var today=new Date(),
			hour=today.getHours();
		if(0<hour&&hour<10)return 'dawn';
		if(10<hour&&hour<18)return 'day';
		else return 'night';
	};

	//返回天气图标
	var returnimg=function(imgIndex){
		var img="background:url(http://p1.qhimg.com/d/_hao360/weather/"+imgIndex+".png) no-repeat;_background-image:none;_filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='http://p1.qhimg.com/d/_hao360/weather/"+imgIndex+".png',sizingMethod='image')";
		return img;
	};

	var returnTemperature=function(info){
		var tempArray=[];
		for(var item in info){
			var _info=info[item];
			tempArray.push(parseInt(_info[2]));
		}
		var min=tempArray.sort()[0],
			max=tempArray.sort()[tempArray.length-1];
		var temperature=min+'°C~'+max+'°C';
		return temperature;
	};

	var returnWeatherTitle=function(info){
		var dawn=info['dawn'][1],
			day=info['day'][1],
			night=info['night'][1];
		var title='黎明:'+dawn+',白天:'+day+',夜间:'+night;
		return title;
	};

	var returnPm25Tip=function(pm25){
		if(pm25<50){
			return ['优','可以正常活动','#096'];
		}else if(pm25>50&&pm25<80){
			return ['良','可以接受的，除极少数对某种污染物特别敏感的人以外，对公众健康没有危害。','#096'];
		}else if(pm25>80&&pm25<150){
			return ['轻度污染','轻微污染 易感人群症状有轻度加剧，健康人群出现刺激症状 心脏病和呼吸系统疾病患者应减少体力消耗和户外活动。','#f93'];
		}else if(pm25>150&&pm25<200){
			return ['中度污染','对污染物比较敏感的人群，例如儿童和老年人、呼吸道疾病或心脏病患者，以及喜爱户外活动的人，他们的健康状况会受到影响，但对健康人群基本没有影响。','#c03']
		}else if(pm25>200){
			return ['重度污染','尽量减少出行，减少室外活动','#c03']
		}
	};

	return {
		todayWeather:function(){
			var info=weather[0]['info'],
				today=[];
			for(var item in info){
				today=info[item];
				break;
			}
			return {
				img:returnimg(today[0]),
				temperature:today[2]+'°C',
				weatherTitle:today[1]
			}
		},
		otherDayWeather:function(){
			return [{
				img:returnimg(weather[1]['info']['day'][0]),
				temperature:returnTemperature(weather[1]['info']),
				weatherTitle:returnWeatherTitle(weather[1]['info'])
			},{
				img:returnimg(weather[2]['info']['day'][0]),
				temperature:returnTemperature(weather[2]['info']),
				weatherTitle:returnWeatherTitle(weather[2]['info'])
			}];
		},
		pmTips:function(pm25){
			return returnPm25Tip(pm25);
		}
	};
}