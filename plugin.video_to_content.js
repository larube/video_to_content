videoToContent=function(links){
	this.init(links);
	
};

videoToContent.prototype={

	videoJsSrc		:'http://commondatastorage.googleapis.com/nb-commons%2Fjs%2Fvideo.js',
	videoJsYouTube	:'http://commondatastorage.googleapis.com/nb-commons/js/vjs.youtube.js',
	videoCssSrc 		:'http://vjs.zencdn.net/4.3.0/video-js.css',
	loaderSrc 		:'http://commondatastorage.googleapis.com/nb-commons%2Fimg%2Fvideo-loading.gif?',
	crossSkipVideoSrc 	: 'http://storage.googleapis.com/mz-commons/js/skip_video_mini.png',


	init:function(cfg){
		if(typeof cfg.urlVideoAd == 'undefined'){throw "No Video Ad link given"; return false;}
		this.links 				= cfg.links;
		this.urlVideoAd 			= cfg.urlVideoAd;
		this.pixelTracking  			= cfg.pixelTracking;
		this.messageRemainingTime 		= cfg.wording || "Votre article dans {{s}} secondes";
		this.loadingMessage 			= cfg.loading || "Chargement de la publicité ";
		this.timerLoadingVideo 		= 0;
		this.stepUpdateTime 			= 250;
		this.limitLoadingTime 			= 12000;
		this.percentVideoToSkip 		= cfg.percentSkipTime || 75;
		this.toleranceCoefficient 		= 2;
		this.determineSkipTime 		= false;
		this.createdSkipCross 			= false;
		this.iOs 				= navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false ;
		this.isFirefox 				= navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
		this.loadVideoJs();
	},

	loadVideoJs : function(){
		if(this.isFirefox){
			return false;
		}
		console.log('init plugin');

		var 	scripts 			=document.getElementsByTagName('script'),
			apiAlreadyLoaded 	=false;

		//Parcours de scripts de la page, si le script est déjà  présent, on ne le recharge pas à  nouveau
		for (var i=0, l=scripts.length; i < l; i++){
			if(scripts[i].src==this.videoJsSrc){ 
				apiAlreadyLoaded=true;
			}
		}  
		if(!apiAlreadyLoaded){
			var tag = document.createElement('script');
			tag.src = this.videoJsSrc;
			tag.setAttribute("type", "text/javascript");
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		}

		this.checkVideoType();
		//this.loadCssFile();
	},

	checkVideoType : function(){
		var 	patternYoutube 	= "youtube.com",
			regYoutube 		= new RegExp(patternYoutube,"g");
		
		this.isYoutube			= regYoutube.test(this.urlVideoAd );

		if(this.isYoutube){
			this.loadYouTubePlugin();
			return true;
		}
		else{
			this.addEventOnClick();
		}
	},


	loadYouTubePlugin : function(){
		if(typeof (videojs)=='undefined'){
			this.waitVideoJs();
		}
		
		else{
			var tag = document.createElement('script');
			tag.src = this.videoJsYouTube;
			tag.setAttribute("type", "text/javascript");
			var firstScriptTag = document.getElementsByTagName('script')[1];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			this.addEventOnClick();
		}
	},

	//Fonction passerelle d attente
	waitVideoJs:function(){
		var self=this;
		setTimeout(function() {
			console.log("videojs");
			self.loadYouTubePlugin();
		}, 100);
		
	},

	/*loadCssFile : function(){
		var css = document.createElement('link');
		css.src = this.videoCssSrc;
		css.setAttribute("type", "text/css");
		css.setAttribute("rel", "stylesheet");
		document.getElementsByTagName("head")[0].appendChild(css);
		
	},*/

	addEventOnClick : function(){
		for(var i =0, linksLength = this.links.length; i < linksLength;i++){
			var link = this.links[i];
			var self = this;
			link.addEventListener('click', function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				evt.returnValue = false;
				self.createVideo(evt, self);
			}, false);
		}
	},

	createVideo : function(evt, obj){

	
		var self = this;
		var divToHideContent 				=  document.createElement('div');
		divToHideContent.style.position 		= "fixed";
		divToHideContent.id 				= "hide-content";
		divToHideContent.style.left 			= 0;
		divToHideContent.style.bottom 		= 0;
		divToHideContent.style.width 			= "100%";
		divToHideContent.style.height 		= "100%";
		divToHideContent.style.backgroundColor 	= "#000";
		divToHideContent.style.zIndex 		=  9999999998;


		document.body.insertBefore(divToHideContent, document.body.firstChild)

		obj.video 			= document.createElement('video');
		obj.video.style.width 		= "100%";
		obj.video.style.height 		= "100%";
		obj.video.controls 		= false;
		obj.video.id 			= window.btoa(new Date().getTime());
		obj.redirectLink  		= evt.target.href;
		obj.videoOptions		={};
		
		if(!obj.isYoutube){
			obj.source 			= document.createElement('source');
			obj.source.src 			= this.urlVideoAd;
			obj.source.type		= "video/"+this.urlVideoAd.split('.').pop();
			obj.video.appendChild(obj.source);
		}

		document.body.insertBefore(obj.video, document.body.firstChild.nextSibling);	
		
		obj.insertedTrackingPixel 	= false;

		if(obj.isYoutube){
			_V_(obj.video.id, { "techOrder": ["youtube"], "src": ""+obj.urlVideoAd+"", "ytcontrols" : true}, function(){
				self.createVideoContainer(self,this);
			});
		}
		else{
			_V_(obj.video.id, { "loop": false }, function(){
				self.createVideoContainer(self,this);
			});
		}

	},

	createVideoContainer : function(obj, player){

		var 	containerVideo 		= player.a,
				self 			= obj,
				heightVideo		= window.getComputedStyle(obj.video,null).getPropertyValue("height"),
				video 			= document.getElementById(obj.video.id),
				videoInfo 		= document.getElementsByClassName("vjs-control-bar");

			//Positionnement et taille du conteneur
			document.documentElement.scrollTop = 0;
			player.width(document.documentElement.clientWidth);
			player.height(document.documentElement.clientHeight);

			player.play();

			if(containerVideo.getElementsByTagName('iframe').length!=0){
				var iframe = containerVideo.getElementsByTagName('iframe')[0];
				iframe.style.height="100%"
				iframe.style.width="100%"
			}

			//Container Video CSS
			containerVideo.style.position = "fixed";
			containerVideo.style.top = 0;
			containerVideo.style.left = 0;
			containerVideo.style.zIndex = 9999999999;
			containerVideo.style.backgroundColor = "#000";
			
			//ajout du loader
			var text 	 			= document.createElement('span');
			text.style.float 				= "left";

			var loader 				= document.createElement('img');
			loader.src 				= obj.loaderSrc;
			loader.style.float 			="left";
			loader.style.width 			="10%"
			loader.style.height 			="2%";
			loader.style.marginLeft 		="2%";
			loader.style.marginTop		="2%";

			var containerLoadingMessage 	= document.createElement('div');
			text.textContent			=	obj.loadingMessage;
			
			containerLoadingMessage.appendChild(text);
			containerLoadingMessage.appendChild(loader);
			
			containerLoadingMessage.style.position 		='absolute';
			containerLoadingMessage.id 				='loading-text-message';
			containerLoadingMessage.style.color 		= "#fff";
			containerLoadingMessage.style.textTransform 	= "uppercase";
			containerLoadingMessage.style.fontSize 		= "1em";
			containerLoadingMessage.style.width 		="100%"
			containerLoadingMessage.style.top 			= "10%";
			containerLoadingMessage.style.textAlign		= "center";
			containerLoadingMessage.style.zIndex 		=9999999999;
			containerLoadingMessage.style.paddingLeft 		='10%';
			containerLoadingMessage.style.paddingRight 	='10%';

			containerVideo.appendChild(containerLoadingMessage);

			//Suppression des infos
			videoInfo[0].style.setProperty("display", "none", "important");
   				
   			//timer check readySate
			self.checkVideoState(obj, video, player);

			
	},

	checkVideoState : function(obj, video, player){
			console.log("checking video state");
			obj.checkVideoStateTimer = setInterval(function(i){

				console.log("video state is" +video.readyState);

					//Can Load Video
					if(video.readyState==4 || video.readyState==3 || video.readyState==2){
						console.log("video has data to play,go on");
						obj.launchVideo(obj, video, player);
					}

					//Trop de temps pour charger la vidéo, on redirige.
					else if(obj.timerLoadingVideo > obj.limitLoadingTime){
						console.log("too long to load video");
						obj.redirectToArticle(obj);
					}
					obj.timerLoadingVideo+=100;
				
				},100);
	},

	launchVideo : function(obj, video, player){
		console.log("launching video");
		
		clearInterval(obj.checkVideoStateTimer);

		//Check si l utilisateur essaye d aller en avant.
		obj.checkUserActions = setInterval(function(){

			//Insertion du pixel d impression
			if(!obj.insertedTrackingPixel && typeof player.videoDuration!='undefined' && player.timeWatched !='undefined'){
				if(player.timeWatched/player.videoDuration >= 0.9){
					console.log("insert pixel");
					obj.insertPixelTracking(obj);
				}
				else if(player.timeWatched/player.videoDuration >= 0.95){
					console.log("watched enough, redirect");
					obj.redirectToArticle(obj);
				}
				else if (typeof player.videoDuration !="undefined" && !obj.determineSkipTime &&  player.videoDuration > 1){
					obj.createSkipVideoTime(player.videoDuration, obj);
				}
			}


			if(player.currentTime() > 1){

				if(typeof player.timeWatched== 'undefined')
				{
					player.timeWatched =player.currentTime();
				}
				
				if(player.currentTime()-player.timeWatched > 1){
					 player.currentTime(player.timeWatched);
					 player.play();
				}
				
				player.timeWatched = player.currentTime();
			}
			else{
				player.videoDuration = player.duration();
			}
		}, 300);


		//update time
		obj.updateRemainingTime(obj, player, video);

		//A la fin de la vidéo, on redirige vers l article
		player.on("ended", function(){
			console.log("video ended");
			console.log(player.timeWatched);
			if(player.duration()-player.timeWatched <1){
				clearInterval(obj.updateTimeTimer)
				obj.redirectToArticle(obj);
			}
		});

		//Si erreur, on redirige vers l article
		player.on("error", function(){
			console.log("error");
			obj.redirectToArticle(obj);
		});


		//Resize et changement d orientation 
		window.onresize = function(event) {
			var divHide = document.getElementById("hide-content");
			divHide.style.height = window.height+"px";

			if(video){
				video.style.width="100%";
				video.style.height="100%";
			}

			width 	= document.documentElement.clientWidth,
			//height 	=  window.innerHeight ;
			height 	=  document.documentElement.clientHeight ;
			
			player.width(width);
			player.height(height);
			if(player.a.getElementsByTagName('iframe').length!=0) {
				var iframe = containerVideo.getElementsByTagName('iframe')[0];
				iframe.style.height="100%";
				iframe.style.width="100%";
			}
		}
	},

	createSkipVideoTime : function(time, obj){
		obj.timeSkipVideo = (obj.percentVideoToSkip/100) * time;
		obj.determineSkipTime = true;
	},

	updateRemainingTime : function(obj, player, video){

			
			obj.updateTimeTimer = setInterval(function(){

				var buffered = player.bufferedPercent();
				var timeRemaining = Math.floor(player.videoDuration-player.timeWatched);
				
				if(isNaN(timeRemaining)){
					timeRemaining = Math.floor(player.duration()-1);
				}

				 if(player.currentTime()>= 0.1 ){

					if(!(obj.textMessage) && player.duration() > 0 ) {

						obj.textMessage 		= document.createTextNode(obj.messageRemainingTime);
						obj.textContainer 		= document.createElement('div');

						//obj.textMessage.textContent=obj.messageRemainingTime;
						obj.textContainer.appendChild(obj.textMessage);
						obj.textContainer.style.position 	='absolute';
						obj.textContainer.style.color 		= "#fff";
						obj.textContainer.style.textTransform = "uppercase";
						obj.textContainer.style.fontSize 	= "1em";
						obj.textContainer.style.width 		="100%"
						obj.textContainer.style.top 		= "10%";
						obj.textContainer.style.textAlign	= "center";
						obj.textContainer.style.zIndex 		= 9999999999;
						
						player.a.appendChild(obj.textContainer);
					}

					
					if(obj.textContainer && timeRemaining > 0.5 ){
						if(document.getElementById("loading-text-message") && video.networkState >=1) {
							var message = document.getElementById("loading-text-message");
							message.parentNode.removeChild(message);
						}
						obj.textContainer.textContent = obj.messageRemainingTime.replace('{{s}}', Math.floor(timeRemaining));
						obj.limitTotalTime 			= player.duration()*obj.toleranceCoefficient*1000;
					}

					//Make the video skippable and create a cross
					if((player.timeWatched > obj.timeSkipVideo) && (!obj.createdSkipCross) && (!obj.iOs)) {
						obj.createClosingElement(player, player.a, obj);
					}
				}

				
				if(player.paused) {
					if(obj.iOs && (player.timeWatched > obj.timeSkipVideo)) {
						obj.redirectToArticle(obj);
					}
					else{
						player.play();
					}
				}

				if(!player.paused()){
					obj.timerLoadingVideo+=obj.stepUpdateTime;
				}
				else{
					player.play();
				}
				obj.checkAllDownloadVideo(obj);
				
			}, obj.stepUpdateTime);			
	},

	createClosingElement : function(player, playerCont, obj){

	
		var crossSkipVideo 			= document.createElement('img');
		crossSkipVideo.src 			= obj.crossSkipVideoSrc;
		crossSkipVideo.style.position 		='absolute';
		crossSkipVideo.style.top 		='7%';
		crossSkipVideo.style.right 		='2%';
		crossSkipVideo.style.width 		='7%';
		crossSkipVideo.style.zIndex 		= 9999999999;


		playerCont.appendChild(crossSkipVideo);

		obj.createdSkipCross = true;

		crossSkipVideo.addEventListener('click', function(){
			obj.redirectToArticle(obj);
		});

	},


	checkAllDownloadVideo : function(obj){
		if(obj.timerLoadingVideo > obj.limitTotalTime){
			console.log('!!! too long to download all media');
			obj.redirectToArticle(obj);
		}
	},

	redirectToArticle : function(obj){
		clearInterval(obj.checkVideoStateTimer);
		clearInterval(obj.checkUserActions);
		console.log('redirect to '+obj.redirectLink);
		window.location = obj.redirectLink;
	},

	insertPixelTracking : function(obj){
		var 	pixelTracking 		= document.createElement('img');
			pixelTracking.src 	= obj.pixelTracking;

		console.log("fn inserting pixel");
		document.body.appendChild(pixelTracking);
		obj.insertedTrackingPixel = true;
	}
}