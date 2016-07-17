/*
*author:think_fish
*description:weatherglass popupjs
*date:2014-07-22 18:27
*version:1.0.0
*copyright:think_fish all rights reservied.
*/
var infoModel={
	"chuanyi":"穿衣指数",
	"ganmao":"感冒指数",
	"kongtiao":"空调",
	"wuran":"污染指数",
	"xiche":"洗车指数",
	"yundong":"运动指数",
	"ziwaixian":"紫外线指数"
};

var sendMessage=function(obj,callback){
	chrome.extension.sendMessage(obj,function(response){
		callback&&callback(response);
	})
};

+function($){
	var BG=chrome.extension.getBackgroundPage();
	var $weatherHeader=$('.weather-header'),
		$cityName=$weatherHeader.find('li:first span:first'),
		$province=$weatherHeader.find('.province'),
		$city=$weatherHeader.find('.city'),
		$town=$weatherHeader.find('.town'),
		$weatherCity=$('.weather-city'),
		$myPosition=$('.weather-myposition'),
		$weatherQulity=$('.weather-qulity'),
		$changeBtn=$myPosition.find('span:last'),
		$confirmBtn=$weatherCity.find('span:last'),
		$weatherFuture=$('.weather-future'),
		$weatherIndex=$('.weather-index'),
		$weatherDays=$('.weather-three-days'),
		$today=$weatherDays.find('.today'),
		$calculate=$weatherHeader.find('.calculate');

	//处理jsonp数据
	var returnJson=function(callbackString){
		var responseString=callbackString.replace('callback(','');
		responseString=responseString.substring(0,responseString.length-2);
		return responseString;
	};

	//返回请求URL
	var returnRequestUrl=function(obj){
		var cityCodeUrl='http://cdn.weather.hao.360.cn/sed_api_area_query.php';
		return cityCodeUrl+'?grade='+obj.grade+'&code='+obj.code+'&app=guideEngine&_='+Math.random(6);
	};

	//城市联动
	var cityChange=function(grade,code,afterChange){
		var $selector=grade=='city'?$city:$town;
		var obj={
			url:returnRequestUrl({grade:grade,code:code}),
			grade:grade,
			code:code
		};
		sendMessage(obj,function(response){
			var data=JSON.parse(decodeURIComponent(returnJson(response)));
			var optionHtml=[];
			var dataArray=data;
			for(var i=0,len=dataArray.length;i<len;i++){
				var option=dataArray[i];
				optionHtml.push('<option value="'+option[1]+'">'+option[0]+'</option>')
			}
			$selector.html(optionHtml.join(''));
			afterChange&&afterChange(dataArray[0][1]);			
		});
	};

	var selectOption=function(index,code){
		var cityOptions=$weatherCity.find('select:eq('+index+') option');
		for(var i=0,len=cityOptions.length;i<len;i++){
			var _option=cityOptions.eq(i);
			if(_option.val()==code)_option.attr('selected','selected');
		}
	};

	$changeBtn.bind('click',function(){
		$myPosition.addClass('hidden');
		$weatherCity.removeClass('hidden');
		var area=BG.db.get('area'),
			provinceCode=area[0][1],
			cityCode=area[1][1],
			townCode=area[2][1];
		selectOption(0,provinceCode);
		cityChange('city',provinceCode,function(){
			selectOption(1,cityCode);
			cityChange('town',cityCode,function(){
				selectOption(2,townCode);
			});
		});
	});

	$province.bind('change',function(){
		var code=$(this).val();
		cityChange('city',code,function(cityCode){
			cityChange('town',cityCode);
		});
	})

	$city.bind('change',function(){
		var code=$(this).val();
		cityChange('town',code);
	});

	//处理返回的天气JSON
	var doWeather=function(data){
		BG.db.set('area',data.area);
		
		var currentArea=data.area;
		$cityName.text(currentArea[currentArea.length-1][0]);
		//初始化七天天气的链接
		var link='http://www.so.com/s?ie=utf-8&shb=1&src=360sou_newhome&q=';
		var city=$myPosition.find('span:first').text();
		$weatherFuture.find('a').attr('href',link+city+'天气');

		//weather
		var weather=data.weather;
		var _weather=new watherHandler(weather),
			_today=_weather.todayWeather(),
			_otherDays=_weather.otherDayWeather();
		//today
		$today.find('.weather-img').attr('style',_today.img).parent().attr('title',_today.weatherTitle);
		$today.find('span:last').text(_today.temperature);

		//otherdays
		for(var item in _otherDays){
			var model=_otherDays[item];
			var el=$weatherDays.find('li:gt(0)').eq(item);
			el.find('.weather-img').attr('style',model.img).parent().attr('title',model.weatherTitle);
			el.find('span:last').text(model.temperature);
		}

		//pm2.5
		if(typeof(data.pm25.pm25)!='undefined'){
			$weatherQulity.show();
			var pm25=data.pm25.pm25[0];
			var pm25Array=_weather.pmTips(parseInt(pm25));
			$weatherQulity.find('span').text(pm25+' '+pm25Array[0]).css('background-color',pm25Array[2]);
			$weatherQulity.find('p').text(pm25Array[1]);

		}else{
			$weatherQulity.hide();
		}
		
		//life
		var life=data.life,
			lifeArray=[];
		for(var item in life.info){
			var info=life.info[item];
			lifeArray.push('<li title="'+info.join('')+'">'+infoModel[item]+':'+info[0]+'</li>')
		}
		$weatherIndex.find('ul').html(lifeArray.join(''));
		$weatherCity.addClass('hidden');
		$myPosition.removeClass('hidden');
	};

	$confirmBtn.bind('click',function(){
		var townCode=$town.find('option:selected').val();
		var obj={
			url:'http://cdn.weather.hao.360.cn/sed_api_weather_info.php?app=search&code='+townCode+'&_'+Math.random(6),
			dataType:'json',
			app:'search',
			code:townCode
		};
		sendMessage(obj,function(response){
			var data=JSON.parse(decodeURIComponent(returnJson(response)));
			doWeather(data);
		});
	});

	var init=function(){
		//初始化日期
		var currentDate=new Date(),
			todayDate=[currentDate.getFullYear(),'年',currentDate.getMonth()+1,'月',currentDate.getDate(),'日'].join('');
		$calculate.text("今天是："+todayDate+' '+showCal());
		//初始化当前地区的天气
		var obj={
			url:'http://weather.hao.360.cn/sed_api_weather_info.php'
		};
		var currentArea=BG.db.get('area');
		if(currentArea){
			var obj={
				url:'http://cdn.weather.hao.360.cn/sed_api_weather_info.php?app=search&code='+currentArea[currentArea.length-1][1]+'&_'+Math.random(6),
				dataType:'json',
				app:'search'
			};
			sendMessage(obj,function(response){
				var data=JSON.parse(decodeURIComponent(returnJson(response)));
				doWeather(data);
			});
		}else{
			sendMessage(obj,function(response){
				var data=JSON.parse(decodeURIComponent(returnJson(response)));
				var currentArea=data.area;
				BG.db.set('area',currentArea);
				var obj={
					url:'http://cdn.weather.hao.360.cn/sed_api_weather_info.php?app=search&code='+currentArea[currentArea.length-1][1]+'&_'+Math.random(6),
					dataType:'json',
					app:'search'
				};
				sendMessage(obj,function(response){
					var data=JSON.parse(decodeURIComponent(returnJson(response)));
					doWeather(data);
				});
			});
		}
	};
	init();

}(jQuery);