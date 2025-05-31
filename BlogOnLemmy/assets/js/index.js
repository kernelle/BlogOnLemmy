"use strict";

const Settings = {
	username: "kernelle",
	firstname: "Martijn",
	lemmy_instance: "https://0d.gs",
	// I use seperate one, if you don't use this then make it the same as lemmy_instance
	cdnurl: "https://cdn.0d.gs"
}

// Lemmy's API only supports community_id on user profiles for now
let Community_filters = {
	"blog": {
		enabled: true,
		c_id: [ 154 ],
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
		c_id: [ 884 ],
		//c_name: [ "belgium@0d.gs" ],
		friendly_name: "News" 
	}	
};

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
let HidePostsOnce = [  ]; // 14956

let AddPostsManual = [ 5074952 ]

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
		this.checkParameters();
		
		// make pagetype related to the setting of a post number
		this.pageType = this.postNumber === -1 ? "filters" : "post";
		
		//Build page
		this.pageBuilder = new PageBuilder( this.pageType, this.postNumber, this.darkmode );
	}
	
	// Check GET and Anchor parameters
	checkParameters(){
		let GETParameters = new URLSearchParams( window.location.search );
		
		let darkmode = Global.getDarkmodeRebel();
		if(darkmode !== null){
			let check = darkmode === "sith";
			this.savedDarkmode = true;
			Global.showSavedDM( check ); 
			this.setDarkMode( check );
		}
		
		if(GETParameters.has("dark")){
			this.savedDarkmode = true;
			this.setDarkMode( GETParameters.get("dark") === "dark" );
		}
		
		// User wants a specific post
		if(GETParameters.has("post")){
			let postPar = GETParameters.get("post")
			if(!isNaN(postPar)){
				this.postNumber = postPar;
			}
		}
		
		// Check hash for filter
		if(window.location.hash) {
			let hash = window.location.hash;
			for (const [key, value] of Object.entries(Community_filters)) {
				if( '#' + key === hash.toLowerCase() ){
					Global.filterClear();
					Community_filters[ key ].enabled = true;
					
					// Do not hide posts on anchor					
					HidePostsOnce = [ ];
					// Ignore anchor
					PageBuilder.scrollToTop( false );
				}
			}
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
		this.pageBuilder.postBuilder.filter( filter );
	}
	
	loadMore( ){
		PageBuilder.checkAnchorToRemove();
		this.pageBuilder.postBuilder.loadmoreContent();
	}
	
	setDarkMode( dmPar ){
		this.darkmode = dmPar;
		this.darkModeCanvas();
		
		document.documentElement.classList = this.darkmode ? [ "darkmode" ] : [ "lightmode" ];
		document.querySelectorAll("#darkmodeToggle>svg")[ !this.darkmode ? 0 : 1 ].classList = [ ];
		document.querySelectorAll("#darkmodeToggle>svg")[ this.darkmode ? 0 : 1 ].classList = [ "disabled" ];
	}
	
	darkModeCanvas(){
		if(typeof this.pageBuilder !== 'undefined'){
			if(typeof this.pageBuilder.aboutme !== 'undefined'){
				this.pageBuilder.aboutme.setDarkmode( this.darkmode );
			}
		}
	}
	
	static showSavedDM( dm ){
		document.querySelectorAll("#cookierebel li")[ !dm ? 0 : 1 ].classList = [ "selected"];
		document.querySelectorAll("#cookierebel li")[ dm ? 0 : 1 ].classList = [ "unselected" ];
	}

	static setDarkmodeRebel( dm ) {
		localStorage.setItem( 'allegiance', dm ); 
	}

	static getDarkmodeRebel() {
		return localStorage.getItem( 'allegiance' );
	}
	
	static filterClear(){
		for (const [key, value] of Object.entries(Community_filters)) {
			Community_filters[key].enabled = false;
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
		document.getElementById("returnTop").addEventListener("click", this.clickScrollToTop);
		document.getElementById("returnTop").children[0].addEventListener("click", this.clickScrollToTop);
		document.getElementById("returnTop").children[0].addEventListener("touchstart", this.clickScrollToTop);
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
		
		Global.setDarkmodeRebel( id );
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
		
		for (const [key, value] of Object.entries(Community_filters)) {
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
		PageBuilder.changeTitle( e.srcElement.innerText );

		
		main.setFilter( filter );	
		
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
				navbar.children[1].id = "floatnav";
				let dynamicOffset = 16;
				if(document.documentElement.offsetWidth > 700){
					dynamicOffset = dynamicOffset*2;
				}
				let offset = navbar.children[1].offsetHeight + dynamicOffset ;
				navbar.style.paddingBottom = offset + "px";
			}
			this.snapNav = true;
			
		}else {
			navbar.children[1].id = "";
			navbar.style.paddingBottom = "";
			this.snapNav = false;
		}
	}
	
	// Scroll back to desired place after new content is loaded
	static checkAnchorAndScroll(){
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
	static checkAnchorToRemove(){
		if(window.location.hash) {
		  switch (window.location.hash){
				case "#about":
					 window.history.replaceState('/', '', '/');
					 break;
		  }
		} 
	}
	
	static scrollToTop( removeAnchor ) {
		// I like to experiment with the specific element this so ill leave it as is
		let loadElement = document.documentElement;
		let htmlPage = document.documentElement;
		if( loadElement ){
			let header = document.getElementsByTagName('header')[0];
			if(header.getBoundingClientRect().top <= htmlPage.scrollTop){
				// Asynchronous smooth scroll to top
				const mutObserve = new MutationObserver(() => {
					mutObserve.disconnect();
					if(header.getBoundingClientRect().top <= htmlPage.scrollTop){
						PageBuilder.smoothScrollTo( htmlPage );
					}
				});
				mutObserve.observe(document.body, { childList: true, subtree: true  });
				PageBuilder.smoothScrollTo( htmlPage );
			}
		}
		if(removeAnchor) PageBuilder.checkAnchorToRemove();
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
		let docScroll = document.documentElement.scrollTop;
		
		let navbar = document.getElementById("filters");
		let offsetNav = navbar.children[0].offsetTop +2;
		let enable = document.body.scrollTop > offsetNav || document.documentElement.scrollTop > offsetNav;
		
		btnScrollTop.style.display = enable ? "flex" : "none";
		
		PageBuilder.floatNav( enable, navbar, offsetNav );
	}
	
	static showLoader( loader ){
		let fadeLoad = document.getElementById("fadeLoad")
		fadeLoad.style.display = loader ? "block" : "none";
	}
	
	static showLoadmore( loadmore ){
		let btnLoadmore = document.getElementById("loadmore");
		btnLoadmore.style.display = "block";
		
		if(loadmore){
			btnLoadmore.children[0].children[0].innerText = "Load more";
			btnLoadmore.children[0].children[0].style.cursor = "pointer";
		}
		else{
			btnLoadmore.children[0].children[0].innerText = "You've reached the end!";
			// Thanks Sean!
			btnLoadmore.children[0].children[0].style.cursor = "default";
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
		Community_filters[ type ].enabled = true;
		
		this.refresh();
	}
	
	// Load next page from API
	loadmoreContent(){
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
		let fullactorID = Settings.lemmy_instance + '/u/' + Settings.username;
		
		if(post.creator.actor_id === fullactorID && post.counts.score >= -3 ){
			const dateParsed = new Date( Date.parse( post.counts.published ) );
			
			// Parsed post content
			let postParsed = {
				title: this.buildTitlePost(post),
				c_id: post.community.id,
				url: post.post.url,
				content: PostBuilder.markdownProcess( post.post.body ),
				date: dateParsed.getDate() + '/' + (dateParsed.getMonth()+1) + '/' + dateParsed.getFullYear(),
				dateObject: dateParsed,
				id: post.counts.post_id,
				upvotes: post.counts.upvotes,
				lemmy_url: post.post.ap_id
			};

			// Parse crosspost upvotes
			crossposts.forEach((xpost) => {
				if(postParsed.upvotes < xpost.counts.upvotes){
					postParsed.upvotes = xpost.counts.upvotes;
					postParsed.lemmy_url = xpost.post.ap_id;
				}

			});

			return postParsed; 
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

		PageBuilder.showLoadmore( false );
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
		let found = false;
		for(let i = 0;i<this.allPosts.length;i++){
			if(this.allPosts[i].id === post.id){
				found = true;
			}
		}
		return found;
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
				title += '<svg class="videoExpand" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-film"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>';
			}
		}
		
		return title;
	}
	
	// Fetch -> API
	refresh( ){
		PostBuilder.hideError();
		PageBuilder.showLoader( true );
		if(this.pagetype === "filters"){
			for (const [key, value] of Object.entries(Community_filters)) {
				if(value.enabled){
					if(value.friendly_name == "Blog"){
						AddPostsManual.forEach((postNr) => this.fetchPost( postNr, false ));
					}

					value.c_id.forEach((el) => {
						this.fetchCommunity( this.loadmorePage, el )
					});
				}
			}

		}else if(this.pagetype === "post"){
			PageBuilder.htmlFilterClear();

			this.fetchPost( this.postNumber, true )
		}
	}

	fetchPost( postNr, onlyPost ){
		fetch(Settings.cdnurl + "/api/v3/post?id=" + postNr)
		.then((response) => response.json())
		.then((json) => this.processPost( json, onlyPost ))
		.catch((error) => PostBuilder.displayError());
	}

	fetchCommunity( pageNumber, c_id ){
		let addPageNumber = pageNumber > 1 ? "&page=" + pageNumber : "";

		const postListAPI = Settings.cdnurl
			+ "/api/v3/user?username="
			+ Settings.username
			+ addPageNumber
			+"&sort=New&community_id="
			+ c_id;
		fetch( postListAPI, { cache:"force-cache"})
		.then((response) => response.json())
		.then((json) => this.processCommunity( json ))
		.catch((error) => PostBuilder.displayError());
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
			let sharedBy = typeof post.url !== "undefined" ? "Shared by" : "By";
			let permalink = "/?post=" + post.id;
			let votetext = post.upvotes > 50 ? post.upvotes + ' <svg xmlns="http://www.w3.org/2000/svg" aria-describedby="likeText" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-heart" role="img"><title id="likeText">Interact with this post on the Fediverse</title><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' : "";
			
			// Lemmyverse allows other Lemmy users to set their preferred instance
			//	- remove https before instance
			let verseReference = "https://lemmyverse.link/" + post.lemmy_url.substring(8);
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
			return this.expandOption( { 'target': e.target.parentNode } )
		}else{
			let expandedElement = this.hasExpandedElement(e.target.parentNode.parentNode)
			if( !expandedElement){
				let link = e.target.parentNode.children[0].href

				let container = document.createElement('div');
				let loadtext = document.createElement('span');
				let video = document.createElement('video');

				container.classList.add("expand")
				loadtext.classList.add("loadtext")
				loadtext.innerText = "Loading Content..."
				video.src = link;
				video.autoplay = true;
				video.loop = true;

				container.appendChild( loadtext )
				container.appendChild( video )

				e.target.parentNode.after( container )
			}else(
				expandedElement.remove()
			)
		}
	}

	hasExpandedElement(parent) {

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
		this.mainSpark = new FireElementCanvas( 
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
		 let source = this.mainSpark.getPos(); 					 
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
			this.mainSpark.updateStill(this.htmlWidth/2, this.htmlHeight/2);
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
			this.mainSpark.enableCycle();
			this.level++;
		}
		
		if(this.level === 3){
			let bounceTarget = this.calculateNextTarget();
			this.mainSpark.updateTarget( bounceTarget.x, bounceTarget.y );
			this.mainSpark.type = "bounce";
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
			this.mainSpark.updateText( calcClicks );
			if(calcClicks >= 200) this.mainSpark.s();
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
		this.mainSpark.next();
		
		this.sparks.forEach(( spark ) => {
			spark.next();
		});
	}
	
	drawSparks(){
		this.prime();
		
		this.sparks.forEach(( spark ) => {
			spark.draw();
		});
		
		this.mainSpark.draw();
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
		&& this.mainSpark.type === 'still'
		&& !this.mainSpark.colour.enable){
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
		//Optimization, only check every second (60 frames)
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
