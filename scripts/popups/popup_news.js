'use strict';

var PopupNews = ( function()
{
	var _Init = function()
	{
		var date = $.GetContextPanel().GetAttributeString( "date", '' );
		date = date.split( ' ' )[ 0 ];
		$.GetContextPanel().SetDialogVariable( 'news_date', date );

		var title = $.GetContextPanel().GetAttributeString( "title", '' );
		$.GetContextPanel().SetDialogVariable( 'news_title', title );

		var link = $.GetContextPanel().GetAttributeString( "link", '' );

		function _OpenUrl ()
		{
			SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser( link );
			$.DispatchEvent( 'UIPopupButtonClicked', '' );
			$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.mainmenu_press_home', 'MOUSE' );
		}

		var elUrlBtn = $.GetContextPanel().FindChildTraverse( 'id-news-url-button' );
		if ( elUrlBtn )
		{
			elUrlBtn.SetPanelEvent( 'onactivate', _OpenUrl );
		}

		  
		                                                                     
		  
		var elBlogHTML = $.GetContextPanel().FindChildTraverse( 'BlogHTML' );
		if ( elBlogHTML )
		{
			               
			                                                                          
			                                       

			                                                                                   
			                                                                                 
			                                              
			if ( link.indexOf( '?' ) < 0 )
				link += '?';
			else
				link += '&';
			link += 'clientview=1';

			                      
			elBlogHTML.SetURL( link );
		}
	};

	var _Close = function()
	{
		                                                                                        
		                                                                                      
		$.DispatchEvent( 'UIPopupButtonClicked', '' );
	};

	function _HTMLFinishRequest ()
	{
		$.Schedule( 0.3, function()
		{
			var elHTML = $.GetContextPanel().FindChildTraverse( 'BlogHTML' );
			if ( elHTML )
			{
				elHTML.AddClass( 'visible' );
			}
		} );

	}

	function _HTMLOpenPopupTab ( objHtmlEventTarget, objHtml, sUrl )
	{
		SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser( sUrl );
		$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.mainmenu_press_home', 'MOUSE' );
	}

	return {
		Init: 					_Init,
		HTMLFinishRequest: 		_HTMLFinishRequest,
		HTMLOpenPopupTab:		_HTMLOpenPopupTab,
		Close: 					_Close
	};

})();

(function()
{
	$.RegisterEventHandler( "HTMLFinishRequest", $.GetContextPanel(), PopupNews.HTMLFinishRequest );
	$.RegisterEventHandler( "HTMLOpenPopupTab", $.GetContextPanel(), PopupNews.HTMLOpenPopupTab );
})();
