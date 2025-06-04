"use strict";

let Settings = {
	username: "kernelle",
	firstname: "Martijn",
	lemmy_instance: "0d.gs",
	// I use a CDN for the actual API requests
	//    if you don't use this then make it the same as lemmy_instance
	mirror: [ "cdn.0d.gs", "lemmy.ml" ],
	mSelect: 0
}

// Lemmy's API only supports community_id on user profiles for now
let Community_filters = [ {
	"blog": {
		enabled: true,
		c_id: [ 154 ],
		manual_posts: [ 5074952 ],
		//c_name: [ "self@0d.gs" ],
		friendly_name: "Blog"
	},
	"linkdumps": {
		enabled: false,
		c_id: [ 59105 ],
		//c_name: [ "linkdumps@0d.gs" ],
		friendly_name: "LinkDumps" 
	},
	"news": {
		enabled: false,
		c_id: [ 884, 58587 ],
		//c_name: [ "belgium@0d.gs" ],
		friendly_name: "News" 
	},
	"all": {
		enabled: false,
		c_id: [ 2547 ],
		friendly_name: "All"
	}
},{
	"blog": {
		enabled: true,
		c_id: [ 331226 ],
		manual_posts: [ 30343141 ],
		friendly_name: "Blog",
	},
	"linkdumps": {
		enabled: false,
		c_id: [ 974974 ],
		friendly_name: "LinkDumps"
	},
	"news": {
		enabled: false,
		c_id: [351392, 664715],
		friendly_name: "News",
	},
	"all": {
		enabled: false,
		c_id: [85477],
		friendly_name: "All"
	}
}];

const About_me = [
	"Electronics–ICT",
	"Cybersecurity",
	"Full-Stack Developer",
	"Pentester",
	"Freelancer",
	"LLL & HLL-Coder",
	"Audiophile",
	"Maker",
	"Analyst",
	"Gamer",
	"Tinkerer",
	"Self-Hoster",
	"Snowboarder",
	"DIY",
	"Longboarder"
];

// Hide these post only once when the main page loads
//	- Currate main page
let HidePostsOnce = [ 14956, 5750794, 30343141 ]; //

/**********************************************************
					Global Class
***********************************************************/
// I was using private functions too but it's not backwards compatible
class Global {
	constructor(){
		//Default values
		this.darkmode = true;
		this.savedDarkmode = false;
		this.postNumber = -1;
		// Check GET parameters
		this.cPar();
		
		// make pagetype related to the setting of a post number
		this.pageType = this.postNumber === -1 ? "filters" : "post";
		
		//Build page
		this.pBuild = new PageBuilder( this.pageType, this.postNumber, this.darkmode );
	}
	
	// Check GET and Anchor parameters
	// checkParameters( )
	cPar(){
		// GETParameters
		let getPar = new URLSearchParams( window.location.search );
		
		let darkmode = Global.getDMR();
		if(darkmode !== null){
			let check = darkmode === "sith";
			this.savedDarkmode = true;
			Global.showSavedDM( check ); 
			this.setDarkMode( check );
		}
		
		if(getPar.has("dark")){
			this.savedDarkmode = true;
			this.setDarkMode( getPar.get("dark") === "dark" );
		}
		
		// User wants a specific post
		if(getPar.has("post")){
			let postPar = getPar.get("post")
			if(!isNaN(postPar)){
				this.postNumber = postPar;
			}
		}
		
		// Check hash for filter
		if(window.location.hash) {
			let hash = window.location.hash;
			for (const [key, value] of Object.entries(Community_filters[Settings.mSelect] )) {
				if( '#' + key === hash.toLowerCase() ){
					Global.filterClear();

					Global.setMirrorForKey( true, key )
					if(key == 'all'){
						this.pageType = key;
					}
					
					// Do not hide posts on anchor					
					HidePostsOnce = [ ];
					// Ignore anchor
					PageBuilder.scrollToTop( false );
				}
			}
		} 
	}

	static setMirrorForKey( status, keyType ){
		for (const [key, value] of Object.entries(Community_filters[Settings.mSelect] )) {
			Community_filters[Settings.mSelect][ keyType ].enabled = status;
		}
	}
	
	/*		 
		START GLOBAL FUNCTIONS
	*/
	getdarkmode(){
		return this.darkmode;
	}
	
	checkSavedDarkmode(){
		return this.savedDarkmode;
	}
	
	setFilter( filter ){
		this.pBuild.postBuilder.filter( filter );
	}

	loadMore( ){
		PageBuilder.checkAtR();
		this.pBuild.postBuilder.loadmoreContent();
	}
	
	setDarkMode( dmPar ){
		this.darkmode = dmPar;
		this.darkModeCanvas();
		
		document.documentElement.classList = this.darkmode ? [ "darkmode" ] : [ "lightmode" ];
		document.querySelectorAll("#darkmodeToggle>svg")[ !this.darkmode ? 0 : 1 ].classList = [ ];
		document.querySelectorAll("#darkmodeToggle>svg")[ this.darkmode ? 0 : 1 ].classList = [ "disabled" ];
	}
	
	darkModeCanvas(){
		if(typeof this.pBuild !== 'undefined'){
			if(typeof this.pBuild.aboutme !== 'undefined'){
				this.pBuild.aboutme.setDarkmode( this.darkmode );
			}
		}
	}
	
	static showSavedDM( dm ){
		let rL = document.querySelectorAll("#cookierebel li");
		rL[ !dm ? 0 : 1 ].classList = [ "selected"];
		rL[ dm ? 0 : 1 ].classList = [ "unselected" ];
	}

	// setDarkmodeRebel()
	static setDMR( dm ) {
		localStorage.setItem( 'allegiance', dm ); 
	}

	// getDarkmodeRebel( )
	static getDMR() {
		return localStorage.getItem( 'allegiance' );
	}
	
	static filterClear(){
		for (const [key, value] of Object.entries(Community_filters[Settings.mSelect])) {
			Global.setMirrorForKey(false, key);
		}
	}
}

/**********************************************************
						END 
					Global Class
***********************************************************/

/**********************************************************
					Page Builder Class
***********************************************************/

class PageBuilder {
	constructor( pageType, postNumber, darkmode ){
		this.pageType = pageType;
		this.postNumber = postNumber;
		this.snapNav = false;
		this.offsetNav = false;
		
		this.pageload = this.pageload.bind(this);
		this.darkmode = darkmode;
		
		document.addEventListener("DOMContentLoaded", this.pageload);
	}
	
	// Executed after page loaded
	initialize(){
		//Show filters according to Settings
		PageBuilder.buildFilters();
		
		//Bind events after filters are set
		this.bindGlobalEvents();
		
		// Fill page with posts
		this.postBuilder = new PostBuilder( this.pageType, this.postNumber );
		this.aboutme = new DrawAboutMe( this.darkmode );
	}
		
	bindGlobalEvents() {
		// Scroll event
		window.onscroll = PageBuilder.showTopButton;
		
		// Click events
		document.getElementById("loadmore").addEventListener("click", this.clickLoadmore);
		document.getElementById("darkmodeToggle").addEventListener("click", this.clickDarkmodetoggle);
		let rTop = document.getElementById("returnTop");
		rTop.addEventListener("click", this.clickScrollToTop);
		rTop.children[0].addEventListener("click", this.clickScrollToTop);
		rTop.children[0].addEventListener("touchstart", this.clickScrollToTop);
		document.querySelectorAll("#cookierebel li").forEach(( options ) => {
			options.addEventListener( "click", this.clickCookieRebel );
		});
		document.querySelectorAll("#filters>ul>li").forEach(( filterBtn ) => {
			filterBtn.addEventListener( "click", PageBuilder.clickFilter );
		});	
		document.querySelectorAll('a').forEach(( aAnchors ) => {
			aAnchors.addEventListener("click", function(e) {
				if(e.target.hash[0] === "#"){
					e.preventDefault();
					document.querySelector(this.getAttribute("href")).scrollIntoView({
						behavior: "smooth"
					});
					window.history.replaceState('', '', '/' + e.target.hash);
				}
			});
		});
	}
	
	pageload( e ){
		const globalDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		
		if (!main.checkSavedDarkmode()) {
			main.setDarkMode( globalDarkMode );
			this.darkmode = globalDarkMode;
		}
		
		this.initialize();
	}
	
	clickDarkmodetoggle( e ){
		main.darkmode = !main.darkmode;
		main.setDarkMode( main.darkmode );
	}
		
	// only for daredevils
	clickCookieRebel( e ){
		let id = e.srcElement.id;
		let checkId = id === 'sith';
		
		Global.setDMR( id );
		main.setDarkMode( checkId );
		Global.showSavedDM( checkId );
	}
	
	clickLoadmore( e ){
		main.loadMore();
	}
	
	clickScrollToTop( e ){
		e.preventDefault();
		PageBuilder.scrollToTop( true );
	}
	
	static htmlFilterClear(){
		let filterBtns = document.querySelectorAll("#filters>ul>li");
		filterBtns.forEach((filterBtn) => {
			filterBtn.classList = [ "unselected" ];
		});
	}
	
	static buildFilters(){
		let filterHTML = "";
		
		for (const [key, value] of Object.entries(Community_filters[Settings.mSelect])) {
			let selectedID = value.enabled ? "selected" : "unselected";
			filterHTML += `<li tabindex="0" class="${ selectedID }">${ value.friendly_name }</li>`;
			if(value.enabled){
				PageBuilder.changeTitle( value.friendly_name );
			}
		}
		
		document.getElementById("filters").children[1].innerHTML = filterHTML;
	}
	
	static clickFilter(e){		
		PageBuilder.showLoader( true );
		let filter = e.srcElement.innerText.toLowerCase();
		// Add anchor to url without reloading
		window.history.replaceState('', '', '/#' + filter);
		
		PageBuilder.htmlFilterClear();
		e.srcElement.classList = [ "selected" ];
		main.setFilter( filter );	
		PageBuilder.changeTitle( e.srcElement.innerText );

		PageBuilder.scrollToTop( true );
		document.getElementById('intro').style.display = "none";
	}
	static changeTitle( change ){
		let titletext = './Martijn.sh > ' + change;
		document.getElementsByTagName('h1')[0].innerText = titletext;
		document.title = titletext;
	}
	
	static floatNav( enable, navbar, offset ){
		if(enable){
			if(!this.snapNav){

				let tH = navbar.children[1].offsetHeight ;
				let offsetX = 0;
				if(document.documentElement.offsetWidth < 700){
					//let tH1 = tH*2 + (tH/2);
					offsetX = tH + 16;
				}else{
					offsetX = tH * 2 - 3 ;
				}
				//text-height + margin (1em) + seletedmargin(0.5em)

				navbar.style.paddingBottom = offsetX + "px";
				navbar.children[1].id = "floatnav";
			}
			this.snapNav = true;
			
		}else {
			navbar.children[1].id = "";
			navbar.style.paddingBottom = "";
			this.snapNav = false;
		}
	}
	
	// Scroll back to desired place after new content is loaded
	// checkAnchorAndScroll()
	static checkAaS(){
		if(window.location.hash) {
		  switch (window.location.hash){
				case "#about":
					window.location.hash = "#about";
					break;
				default:
					// Disable Anchorscroll for other anchors
					PageBuilder.scrollToTop( false );
		  }
		} 
	}
	
	// Remove only specific anchors
	// checkAnchorToRemove()
	static checkAtR(){
		if(window.location.hash) {
		  switch (window.location.hash){
				case "#about":
					 window.history.replaceState('/', '', '/');
					 break;
		  }
		} 
	}
	
	static scrollToTop( removeAnchor ) {
		let doc = document.documentElement;
		if( doc ){
			let header = document.getElementsByTagName('header')[0];
			if(header.getBoundingClientRect().top <= doc.scrollTop){
				// Asynchronous smooth scroll to top
				const mutObserve = new MutationObserver(() => {
					mutObserve.disconnect();
					if(header.getBoundingClientRect().top <= doc.scrollTop){
						PageBuilder.smoothScrollTo( doc );
					}
				});
				mutObserve.observe(document.body, { childList: true, subtree: true  });
				PageBuilder.smoothScrollTo( doc );
			}
		}
		if(removeAnchor) PageBuilder.checkAtR();
	} 
	
	static smoothScrollTo( toElement ){
		const top = toElement.getBoundingClientRect();
		//htmlPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
		window.scrollTo({
		  top: window.scrollY + top,
		  behavior: 'smooth',
		});
	}
	
	static showTopButton() {
		let btnScrollTop = document.getElementById("returnTop");
		let bodyScroll = document.body.scrollTop;
		//let docScroll = document.documentElement.scrollTop;
		
		let navbar = document.getElementById("filters");
		let offsetNav = navbar.children[0].offsetTop + navbar.children[0].offsetHeight;
		let enable = document.body.scrollTop > offsetNav || document.documentElement.scrollTop > offsetNav;
		
		btnScrollTop.style.display = enable ? "flex" : "none";
		
		PageBuilder.floatNav( enable, navbar, offsetNav );
	}
	
	static showLoader( loader ){
		let fadeLoad = document.getElementById("fadeLoad")
		fadeLoad.style.display = loader ? "block" : "none";
	}
	
	static showLoadmore( loadmore ){
		let btnL = document.getElementById("loadmore");
		btnL.style.display = "block";
		btnL = btnL.children[0].children[0];
		if(loadmore){
			btnL.innerText = "Load more posts!";
			btnL.style.cursor = "pointer";
		}
		else{
			btnL.innerText = "You've reached the end!";
			// Thanks Sean!
			btnL.style.cursor = "default";
		}
	}
}

/**********************************************************
							END 
					Page Builder Class
***********************************************************/

/**********************************************************
					Post Builder Class
***********************************************************/

class PostBuilder {
	constructor( pageType, postNum = -1 ){
		this.DOMLocationArticles = document.getElementById('contentArts');
		this.allPosts = [ ];
		this.pagetype = pageType;
		this.postNumber = postNum;
		this.loadmorePage = 1;
		this.singletonLoadmore = false;
		
		this.overridePermalink = this.overridePermalink.bind(this);
		this.expandOption = this.expandOption.bind(this);
						
		this.refresh();
	}
	
	// Reset page as if it was new
	resetFilters(){
		this.allPosts = [];
		this.loadmorePage = 1;
		this.postNumber = -1;
		this.singletonLoadmore = false;
		
		Global.filterClear();
	}
	
	filter( type ){
		this.resetFilters();
		this.pagetype = "filters";
		
		//Set filter
		Global.setMirrorForKey(true, type);
		
		this.refresh();
	}

	
	// Load next page from API
	loadmoreContent( ){
		this.loadmorePage++;
		this.singletonLoadmore = false;
		this.refresh();
	}
	
	// Check if post needs to be hidden
	static checkTempHidden( postid ){
		let found = false;
		HidePostsOnce.forEach((postToHide, index) => {
		  if (postid === postToHide){
			  // I choose to only remove posts at the first load 
			  // remove the next line if you want to never see the posts
			  HidePostsOnce.pop( index );
			  
			  found = true;
		  }
		});
		return found;
	}
	
	static markdownProcess( content ){
		let p = content;
		if( typeof p === 'undefined' || p == ""){
			return "";
		}
		//Simple pattern to match standalone URL's, probably will have many edge cases
		// - not replacing if preceeded by ( to contain markdown
		const pattern = /(?<!\()\b((?:(?:https?|http):\/\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

		p = p.replace(pattern,  function(match, arg){
			return `<a target="_blank" href='${arg}'>${arg}</a>`;
		})
		
		p = snarkdown( p );
		
		return p;
	}
	
	// API adaptor for post object
	parsePost( post, crossposts=[] ){
		let fullactorID = "https://"+Settings.lemmy_instance + '/u/' + Settings.username;
		
		if(post.creator.actor_id === fullactorID && post.counts.score >= -3 ){
			const dateParsed = new Date( Date.parse( post.counts.published ) );
			
			// Parsed post content
			let p = {
				title: this.buildTitlePost(post),
				c_id: post.community.id,
				url: post.post.url,
				content: PostBuilder.markdownProcess( post.post.body ),
				date: dateParsed.getDate() + '/' + (dateParsed.getMonth()+1) + '/' + dateParsed.getFullYear(),
				dateObject: dateParsed,
				id: post.counts.post_id,
				up: post.counts.upvotes,
				lemmy_url: post.post.ap_id
			};

			// Parse crosspost upvotes
			crossposts.forEach((xpost) => {
				if(p.up < xpost.counts.upvotes){
					p.up = xpost.counts.upvotes;
					p.lemmy_url = xpost.post.ap_id;
				}

			});

			return p;
		}
		return false;
	}
	
	processPost( json, onlyPost ){
		PageBuilder.showLoader( false );


		let post = this.parsePost(json.post_view, json.cross_posts);
		this.displayContent( this.checkPostOrderOrDupes( [ post ] ) );

		if(onlyPost){
			document.getElementById('intro').style.display = "none";

			//Open video when loading only the post
			let expandOption = document.getElementsByClassName("videoExpand")
			if( expandOption.length > 0 ){
				const cE = new Event("click");
				expandOption[0].dispatchEvent(cE);
			}
		}

		if(!this.singletonLoadmore){
			PageBuilder.showLoadmore( false );
		}
	}
		
	processCommunity( json ){
		let posts = [];
		
		for(let i=0;i<json.posts.length;i++){
			let post = this.parsePost( json.posts[i] );
			if(post !== false){
				if( !PostBuilder.checkTempHidden( post.id ) ){
					posts.push( post );
				}
			}
		}
				
		let orderedNoDupes = this.checkPostOrderOrDupes( posts );
		this.displayContent( orderedNoDupes );
		PageBuilder.showLoader( false );
		
		// Handle 'load more' button
		// - can only be set if not already set
		// for multiple filter selections but only one has more content
		if(!this.singletonLoadmore){
			//Lemmy API Limits 10 posts
			// - sometimes it replies 9 and there still is a next page?
			this.singletonLoadmore = posts.length >= 9;
			PageBuilder.showLoadmore( this.singletonLoadmore );
		}
	}
		
	// Sort post list by date and do not allow duplicates
	checkPostOrderOrDupes(posts){
		for(let j = 0;j<posts.length;j++){
			let checkPost = this.checkPostExists(posts[j]);
			
			if(!checkPost){
				let dateIndex = 0;
				for(let i = 0;i<this.allPosts.length;i++){
					if(this.allPosts[i].dateObject > posts[j].dateObject){
						dateIndex = i+1;
					}
				}
				
				if(dateIndex === 0){
					this.allPosts.unshift( posts[j]);
				}else{
					this.allPosts.splice(dateIndex, 0, posts[j]);
				}
			}
		}
		
		return this.allPosts;
	}
	
	// Check if main list already contains post
	checkPostExists( post ){
		for(let i = 0;i<this.allPosts.length;i++){
			if(this.allPosts[i].id === post.id){
				return true;
			}
		}
		return false;
	}
	
	// Title of post markup
	//	1) Without link
	//	2) With link and <sub> link preview
	buildTitlePost(post){
		// 1):
		let title = post.post.name;
		let hostnamePost = typeof(post.post.url) !== 'undefined' ? "(" + new URL( post.post.url ).hostname + ")": "";

		// 2):
		if(typeof post.post.url !== 'undefined'){
			// Seperated <a> link for preview and url 
			//	- To break the underline between elements
			title = `<a href="${post.post.url}">${title}</a> `;
			title += `<a href="${post.post.url}"><sub>${hostnamePost}</sub></a>`;

			if( post.post.url.split('.').pop() == 'mp4' ){
				title += '<svg class="videoExpand" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>';
			}
		}
		
		return title;
	}

	setAll( ){
		for (const [key, value] of Object.entries(Community_filters[Settings.mSelect])) {
			Global.setMirrorForKey(true, key);
		}


		for (const key of document.querySelectorAll('#filters li') ) {
			key.classList = [ "selected" ]
		}
	}
	
	// Fetch -> API
	refresh( setall=false){
		PostBuilder.hideError();
		PageBuilder.showLoader( true );

		if(this.pagetype === "filters"){
			let mselect = Settings.mSelect;
			for ( const [key, value] of Object.entries( Community_filters[Settings.mSelect] ) ) {
				if(( value.enabled || setall ) && mselect == Settings.mSelect){
					if(typeof value.manual_posts !== 'undefined'){
						value.manual_posts.forEach((postNr) => this.fetchPost( postNr, false ));
					}

					value.c_id.forEach((el) => {
						this.fetchCommunity( this.loadmorePage, el )
					});

					if(key == 'all' && !setall){
						this.setAll();
						return this.refresh( true )
					}
				}
			}

		}else if(this.pagetype === "post"){
			PageBuilder.htmlFilterClear();

			this.fetchPost( this.postNumber, true )
		}
	}

	fetchPost( postNr, onlyPost ){
		let mselect = Settings.mSelect;
		fetch("https://" + Settings.mirror[Settings.mSelect] + "/api/v3/post?id=" + postNr)
		.then((response) => response.json())
		.then((json) => this.processPost( json, onlyPost ))
		.catch((error) => this.handleErrorCommunity( mselect ));
	}

	fetchCommunity( pageNumber, c_id ){
		let addPageNumber = pageNumber > 1 ? "&page=" + pageNumber : "";
		let mselect = Settings.mSelect;
		const postListAPI = "https://" + Settings.mirror[Settings.mSelect]
			+ "/api/v3/user?username="
			+ Settings.username + "@" + Settings.lemmy_instance
			+ addPageNumber
			+"&sort=New&community_id="
			+ c_id;
		fetch( postListAPI, { cache:"force-cache"})
		.then((response) => response.json())
		.then((json) => this.processCommunity( json ))
		.catch((error) => this.handleErrorCommunity( mselect ));
	}

	//mSel keeps track of the selected mirror between requests
	handleErrorCommunity( mSel ){
		//ignore error if mSelect has been changed between Mirrors
		if(mSel == Settings.mSelect){
			if(Settings.mSelect < Settings.mirror.length){
				Settings.mSelect++;
				//this.resetFilters();
				this.refresh();
			}else{
				PostBuilder.displayError()
			}
		}
	}

	static displayError(){
		let errorArticle = document.getElementById("error");
		errorArticle.style.display = "block";
		PageBuilder.showLoader( false );
	}
	
	static hideError(){
		let errorArticle = document.getElementById("error");
		errorArticle.style.display = "none";
	}


	displayContent(posts){
		let resultBuilder = "";
		let c_id = 0;
		
		if(posts[0] === false){
			return;
		}
		
		for(let i = 0;i<posts.length;i++){
			let post = posts[i];
			c_id = post.c_id.toString();
			
			let oldcontent = post.content;
			post.content = this.postToReadMore( post.content );
			// Posts are shared or written, link = shared
			let forceBy = ( post.c_id != Community_filters[Settings.mSelect]['blog'].c_id[0] && post.id != Community_filters[Settings.mSelect]['blog'].manual_posts[0] )
			let sharedBy = ( typeof post.url !== "undefined" && forceBy ) ? "Shared by" : "By";
			let permalink = "/?post=" + post.id;
			let votetext = post.up >= 20 ? post.up + ' <svg xmlns="http://www.w3.org/2000/svg" aria-describedby="likeText" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img"><title id="likeText">Interact with this post on the Fediverse</title><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' : "";
			
			// Lemmyverse allows other Lemmy users to set their preferred instance
			//	- remove https before instance
			let verseReference = "https://lemmyverse.link/" + Settings.lemmy_instance + "/post/"+  post.id;
			let articleTemplate = `<article>
				<div>
					<header>
					   <h2>${post.title} </h2>
					   
						<div>
						  <span class="fade">
							<b> ${sharedBy} ${Settings.firstname}, ${post.date}</b><i> <a class="onepagelink" href="${permalink}">permalink</a></i>
						  </span>
						</div>
					</header>
						<div class="content">
							${post.content}
						</div>
					<div class="readmore">
						<p>${votetext}</p>
						<a target="_blank" href="${verseReference}">Comment on Fediverse</a>
					</div>
				</div>
				
			</article>`;
			resultBuilder = `${resultBuilder} ${articleTemplate}`;
		}
		
		this.DOMLocationArticles.innerHTML = resultBuilder;
			
		document.querySelectorAll(`.community${c_id} .onepagelink`).forEach(( pm ) => {
			pm.addEventListener( "click", this.overridePermalink );
		});

		document.querySelectorAll(`.videoExpand`).forEach(( vE ) => {
			vE.addEventListener( "click", this.expandOption );
		});

		
		this.removeOverrideEvents();
		this.addOverrideEvents();
	}
	collapseReadmore(e){
		e.target.parentElement.getElementsByClassName("collapse")[0].style.display = "block";
		e.target.style.display = "none";
	}
	
	overridePermalink(e){
		e.preventDefault();
		
		window.history.replaceState('', '', e.target.href );
		let urlGet = new URL( e.target.href ).searchParams;
		
		if( urlGet.has( "post" ) ){
			let postPar = urlGet.get( "post" );
			if(!isNaN( postPar )){
				this.resetFilters();
				this.postNumber = postPar;
				this.pagetype = "post";
				PageBuilder.scrollToTop( false );
				this.refresh();
			}
		}	
	}

	addOverrideEvents(){
		document.querySelectorAll(".uncollapse").forEach(( el ) => {
			el.addEventListener( "click", this.collapseReadmore );
		});
		document.querySelectorAll(".onepagelink").forEach(( pm ) => {
			pm.addEventListener( "click", this.overridePermalink );
		});
	}

	removeOverrideEvents(){
		document.querySelectorAll(".uncollapse").forEach(( el ) => {
			el.outerHTML = el.outerHTML;
		});
		document.querySelectorAll(".onepagelink").forEach(( pm ) => {
			pm.outerHTML = pm.outerHTML;
		});
	}

	expandOption(e){
		if(e.target.nodeName != 'svg'){
			return this.expandOption( { 'target': e.target.parentNode } );
		}else{
			let exEl = this.hasExpanded(e.target.parentNode.parentNode);
			if( !exEl){
				let link = e.target.parentNode.children[0].href;

				let container = document.createElement('div');
				let loadtext = document.createElement('span');
				let video = document.createElement('video');

				container.classList.add("expand");
				loadtext.classList.add("loadtext");
				loadtext.innerText = "Loading Video...";
				video.src = link;
				video.autoplay = true;
				video.loop = true;

				container.appendChild( loadtext );
				container.appendChild( video );

				e.target.parentNode.after( container );
			}else{
				exEl.remove();
			}
		}
	}

	hasExpanded(parent) {
		for (const el of parent.children) {
			if(el.classList.toString() == "expand"){
				return el;
			}
		}
		return false;
	}
	
	// Make post expandable
	postToReadMore( content ){
		let count = (content.match(/<br \/><br \/>/g) || []).length;
		if( /class="collapse"/g.test(content) ) return content;
		let temp = content;
		let countCutoffLength = 0;
		let newcontent = content;
		
		if(count > 2 && this.pagetype === 'filters'){
			//Cut off after 3 paragraphs
			for(let i = 0; i < 2; i++){
				let index = temp.indexOf("<br /><br />") + 12;
				countCutoffLength += index;
				temp = temp.substring( index );
			}
			
			newcontent = content.substring( 0, countCutoffLength )
							+ '<p class="uncollapse">Read more</p><div class="collapse">' 
							+ content.substring( countCutoffLength )
							+ "</div>";
		}
		return newcontent;
	}
}

/**********************************************************
							END 
					Post Builder Class
***********************************************************/

/**********************************************************
					About Me Class
***********************************************************
This escalated a bit, but it's my website so deal with it.
***********************************************************/

class DrawAboutMe {
	constructor( darkmode ){
		this.canvas = document.getElementById("aboutme");
		this.ctx = this.canvas.getContext("2d");
		
		this.init = this.init.bind(this);
		this.drawSparks = this.drawSparks.bind(this);
		this.clickCanvas = this.clickCanvas.bind(this);
		this.frame = this.frame.bind(this);
		
		this.fullLength = 0;
		this.sparks = [ ];
		this.selectedSpark = 0;
		this.darkmode = darkmode;
		
		this.clickedAmount = 0;
		this.level = 0;
		
		this.init();
		this.firstSpark();
		this.drawSparks();
		
		this.bindEvents();
	}
	
	init(){
		this.rescale();
		this.prime();
	}
	
	firstSpark(){
		this.mSpark = new FireElementCanvas(
							"Click me!",
							this.getCenter(), 
							this.getCenter(),
							250,
							this.canvas,
							"still");
	}
	
	newFire( type, lifetime=-1 ){
		let title = About_me[ this.selectedSpark ];
		//let source = this.getCenter();
		 let source = this.mSpark.getPos();
		this.selectedSpark++;
		if( this.selectedSpark >= About_me.length ) this.selectedSpark = 0;
		
		return new FireElementCanvas( 
				title,
				source,
				this.calculateNextTarget(),
				200,
				this.canvas,
				type,
				lifetime);
	}
	
	getCenter(){
		return { 
			x: this.htmlWidth / 2, 
			y: this.htmlHeight / 2 
		};
	}
	
	setDarkmode( dm ){
		this.darkmode = dm;
		this.drawSparks();
	}
	
	bindEvents(){
		this.canvas.addEventListener("click", this.clickCanvas );
		
		window.addEventListener('resize', () => {
			this.init();
			this.mSpark.updateStill(this.htmlWidth/2, this.htmlHeight/2);
			this.drawSparks();
		});
		
		//Redraw when window is refocused
		document.addEventListener("visibilitychange", this.drawSparks);
		window.addEventListener("orientationchange", this.drawSparks);
		window.addEventListener("focus", this.drawSparks);
		window.addEventListener("pageshow", this.drawSparks);
	}
	
	clickCanvas(e){
		this.clickedAmount++;
		this.stateMachine();
		this.runEngine();
	}
	
	calculateNextTarget(){
		let w = this.htmlWidth;
		let h = this.htmlHeight;
		
		let newTarget = DrawAboutMe.randomTarget( w, h );
		let diff = this.target - newTarget;
		let minDiff = this.fullLength / 4;
		
		while(diff > -1 * minDiff && diff < minDiff){
			newTarget = DrawAboutMe.randomTarget( w, h );
			diff = this.target - newTarget;
		}
		
		this.target = newTarget;
		return DrawAboutMe.targetToCoords( newTarget, w, h );
	}
	
	//Unfold cube into string, get random position
	static randomTarget(w, h){
		return Math.round( Math.random() * ( ( w * 2 ) + ( h * 2 ) ) );
	}
	
	// Plot a string along a cube
	static targetToCoords( target , w, h ){
		let coords = {
			x: 0,
			y : 0
		}
		
		let q1 = target;
		let q2 = target - w;
		let q3 = target - w - h;
		let q4 = target - (w * 2) - h;
		
		if( q4 > 0 ){		coords = { x: 0, y : h - q4 }
		}else if( q3 > 0 ){ coords = { x: w - q3, y : h }
		}else if( q2 > 0 ){ coords = { x: w, y : q2 }
		}else {				coords = { x: q1, y : 0 } }
		
		return coords;
	}
	
	rescale(){
		this.htmlWidth = this.canvas.offsetWidth;
		this.htmlHeight = this.canvas.offsetHeight;
		
		// Render to screen ratio
		//const ratio = Math.ceil(window.devicePixelRatio);
		
		this.fullLength = (this.htmlWidth * 2) + (this.htmlHeight * 2);
		this.canvas.setAttribute('width', this.htmlWidth);
		this.canvas.setAttribute('height', this.htmlHeight);
		this.ctx = this.canvas.getContext("2d");
		//this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
	}
	
	prime(){
		this.clearCanvas();
		this.ctx.font = "1.3em Courier New, monospace";
		this.ctx.fillStyle = this.darkmode ? "white" : "black";
	}
	
	stateMachine(){
		let type = "shoot";
		let lifetime = -1;
		
		if(this.level === 1){
			this.mSpark.enableCycle();
			this.level++;
		}
		
		if(this.level === 3){
			let bounceTarget = this.calculateNextTarget();
			this.mSpark.updateTarget( bounceTarget.x, bounceTarget.y );
			this.mSpark.type = "bounce";
			this.level++;
		}
		
		if(this.level >= 6){
			type = "bounce";
			if(this.countBounceSparks() >= About_me.length){
				lifetime = 5;
			}
		}
		
		if(this.level >= 10){
			//Minus 2, 2 skipped levels
			let calcClicks = ( ( this.level - 2) * About_me.length ) + this.clickedAmount;
			this.mSpark.updateText( calcClicks );
			if(calcClicks >= 200) this.mSpark.s();
		}
				
		if( this.clickedAmount === About_me.length ){
			this.level++;
			this.clickedAmount = 0;
		}
		
		this.sparks.push( this.newFire( type, lifetime ) );
	}
	
	clearCanvas(){
		this.ctx.clearRect(0, 0, this.htmlWidth, this.htmlHeight);
	}
	
	runEngine(){		
		if(!this.running){
			this.running = true;
			this.frame();
		}
	}
	
	frame(){
		this.destroySparks();
		this.drawSparks();
		this.updateSparks();
		
		//144Hz-ish refresh
		if(this.running) setTimeout(this.frame, 7);
	}
	
	updateSparks(){
		this.mSpark.next();
		
		this.sparks.forEach(( spark ) => {
			spark.next();
		});
	}
	
	drawSparks(){
		this.prime();
		
		this.sparks.forEach(( spark ) => {
			spark.draw();
		});
		
		this.mSpark.draw();
	}
	
	destroySparks(){
		for(let i = 0; i < this.sparks.length;i++){
			if(this.sparks[i].destroy){
				this.sparks.splice(i, 1);
				i = 0;
			}
		}
		
		//Stop the engine when no sparks are flying
		if(this.sparks.length === 0 
		&& this.mSpark.type === 'still'
		&& !this.mSpark.colour.enable){
			this.running = false;
		}
	}
	
	countBounceSparks(){
		let count = 0;
		for(let i = 0; i < this.sparks.length;i++){
			if(this.sparks[i].type === "bounce"){
				count++;
			}
		}
		return count;
	}
}

class FireElementCanvas {
	constructor( text,
				startCoord,
				endCoord,
				steps,
				canvas,
				type,
				lifetime = -1){
		this.type = type;
		this.text = text;
		this.coord = startCoord;
		this.canvas = canvas;
		this.ctx = this.canvas.getContext("2d");
		this.p = false;
		this.steps = steps;
		this.lifetime = lifetime;
		
		this.update( this.coord.x, this.coord.y );
		
		this.endCoord = endCoord;
		this.prevCoord = startCoord;
		
		this.updateTarget( this.endCoord.x, this.endCoord.y );
		this.destroy = false;
		
		this.lastcheckago = 0;
		this.colour = {
			hue: 300,
			step: 2,
			enable: false
		}
	}
	
	next(){
		switch (this.type){
			case "shoot":
				this.shoot()
				break;
			case "bounce":
				this.bounce()
				break;
		}
		
		if(this.colour.enable){
			this.cycleColours();
		}
		
		return this.coord;
	}
	
	bounce(){
		let cvWidth = this.canvas.width;
		let cvHeight = this.canvas.height;
				
		if (this.coord.x <= 0) {
			//Snap item back into border for literal edge cases
			this.coord.x = 1;
			this.stepSize.x = -1 * this.stepSize.x;
		} else if (this.coord.x >= cvWidth - this.textWidth) {
			this.coord.x = cvWidth - this.textWidth - 1;
			this.stepSize.x = -1 * this.stepSize.x;
		}

		if (this.coord.y <= this.textHeight) {
			this.coord.y = this.textHeight + 1;
			this.stepSize.y = -1 * this.stepSize.y;
		} else if (this.coord.y >= cvHeight) {
			this.coord.y = cvHeight - 1;
			this.stepSize.y = -1 * this.stepSize.y;
		}
		
		this.coord.x += this.stepSize.x;
		this.coord.y += this.stepSize.y;
		this.lastcheckago++;
		if(this.lifetime !== -1 && this.lifetime * 144 < this.lastcheckago){
			this.destroy = true;
		}
	}
	
	shoot(){
		if( !this.compare() ){
			this.coord.x += this.stepSize.x;
			this.coord.y += this.stepSize.y;
		}
	}
	
	//offsetWidth
	compare(){
		//Optimization, only check every second-ish
		if(this.lastcheckago === 144){
			let cvWidth = this.canvas.width;
			let cvHeight = this.canvas.height;
		
			if(this.coord.x < -this.textWidth 
			|| this.coord.x > cvWidth + this.textWidth 
			|| this.coord.y < -this.textHeight 
			|| this.coord.y > cvHeight + this.textHeight ){
				this.destroy = true;
			}
			
			this.lastcheckago = 0;
		}
		this.lastcheckago++;
		return this.destroy;
	}
	
	draw( ){
		if(this.colour.enable){
			let fillstyle = this.ctx.fillStyle;
			let font = this.ctx.font;
			let hueStyle = `hsl(${this.colour.hue}, 100%, 50%)`;
			this.ctx.fillStyle = hueStyle;
			this.ctx.font = "bold " + font;
			
			this.ctx.fillText(this.text, this.coord.x, this.coord.y);
			
			if(this.p) document.documentElement.style.color = hueStyle;
			this.ctx.font = font;
			this.ctx.fillStyle = fillstyle;
		}else{
			this.ctx.fillText(this.text, this.coord.x, this.coord.y);
		}
	}
	
	update(x, y){
		let textView = this.ctx.measureText(this.text);
		
		this.textHeight = ( textView.emHeightAscent + textView.emHeightAscent ) /2;
		if( isNaN(this.textHeight) ){
			this.textHeight = 5 + ( textView.actualBoundingBoxAscent + textView.actualBoundingBoxDescent ) /2;
		}
		
		
		this.textWidth = this.ctx.measureText(this.text).width ;
		this.coord.x = x - ( this.textWidth  / 2);
		this.coord.y = y;
	}
	
	s(){ this.p = true; }
	updateStill(x, y){
		if(this.type === 'still'){
			this.update(x, y);
		}
	}
	
	updateTarget(x, y){
		this.endCoord.x = x;
		this.endCoord.y = y;
		
		this.stepSize = {
			x: (this.coord.x - this.endCoord.x) / this.steps,
			y: (this.coord.y - this.endCoord.y) / this.steps
		}
	}
	
	updateText( text ){
		this.text = text;
		this.textWidth = this.ctx.measureText(this.text).width ;
	}
	
	enableCycle(){
		this.colour.enable = true;
	}
	
	cycleColours(){
		//Hue wraps around after 360
		this.colour.hue = (this.colour.hue + this.colour.step) % 360;
	}
	
	getPos() {
		return { x: this.coord.x + ( this.textWidth  / 2), y: this.coord.y} 
	} 		
}

/**********************************************************
						END 
					About Me Class
***********************************************************/

/**********************************************************
						MAIN START
***********************************************************/
const main = new Global();
/**********************************************************
						MAIN END
***********************************************************/
