'use strict';

var OperationUtil = ( function () {

	var m_nSeasonAccess = -1;
	var m_numTierUnlocked = 0;
	var m_numMissionsCompleted = 0;

	                         
	var m_nRedeemableGoodsCount = 0;

	var m_numMissionsRewardThresholds = 0;
	var m_bPremiumUser = false;
	var m_nCoinRank = 0;
	var m_nActiveCardIndex = 0;
	var m_nRewardsCount = 0;
	var m_numRedeemableBalance = 0;
	var m_nLoopingRewardsCount = 0;
	var m_bPrime = false;
	var m_aCoinDefIndexes = [4700, 4701, 4702, 4703];
	var m_aStarDefIndexes = [4704, 4705, 4706]
	var m_passStoreId = 4699;

	var _ValidateOperationInfo = function( nSeasonAccess )
	{
		                                               
		                               
		                                                                          
		m_nSeasonAccess = nSeasonAccess;
		
		if ( nSeasonAccess < 0 || nSeasonAccess === null )
			return false;
		
		m_nSeasonAccess = nSeasonAccess;
		                                                 

		m_nCoinRank = MyPersonaAPI.GetMyMedalRankByType( ( m_nSeasonAccess + 1 ) + "Operation$OperationCoin" );
		                                           

		m_bPrime = PartyListAPI.GetFriendPrimeEligible( MyPersonaAPI.GetXuid() );
		m_nRewardsCount = MissionsAPI.GetSeasonalOperationTrackRewardsCount( m_nSeasonAccess );
		m_nRedeemableGoodsCount = MissionsAPI.GetSeasonalOperationRedeemableGoodsCount( m_nSeasonAccess );
		m_nLoopingRewardsCount = MissionsAPI.GetSeasonalOperationLoopingRewardsCount( m_nSeasonAccess );
		m_numMissionsRewardThresholds = MissionsAPI.GetSeasonalOperationXpRewardsThresholds( m_nSeasonAccess );

		                                                                                                                         
		var idxOperation = InventoryAPI.GetCacheTypeElementIndexByKey( 'SeasonalOperations', m_nSeasonAccess );
		if ( idxOperation != undefined && idxOperation != null
			&& InventoryAPI.GetCacheTypeElementFieldByIndex( 'SeasonalOperations', idxOperation, 'season_value' ) == m_nSeasonAccess )
		{	                                                         
			m_numMissionsCompleted = InventoryAPI.GetCacheTypeElementFieldByIndex( 'SeasonalOperations', idxOperation, 'missions_completed' );
			m_numTierUnlocked = InventoryAPI.GetCacheTypeElementFieldByIndex( 'SeasonalOperations', idxOperation, 'tier_unlocked' );
			if ( m_nRedeemableGoodsCount && m_nRedeemableGoodsCount > 0 )
			{
				var spt = InventoryAPI.GetCacheTypeElementFieldByIndex( 'SeasonalOperations', idxOperation, 'season_pass_time' );
				m_bPremiumUser = ( spt && ( spt > 0 ) ) ? true : false;
			}
			else
			{
				var spt = InventoryAPI.GetCacheTypeElementFieldByIndex( 'SeasonalOperations', idxOperation, 'premium_tiers' );
				m_bPremiumUser = ( spt && ( spt >= 1 ) ) ? true : false;
			}
			m_nActiveCardIndex = MissionsAPI.GetSeasonalOperationMissionCardActiveIdx( m_nSeasonAccess );
			m_numRedeemableBalance = InventoryAPI.GetCacheTypeElementFieldByIndex( 'SeasonalOperations', idxOperation, 'redeemable_balance' );
		}
		else
		{
			                                             

			m_numMissionsCompleted = 0;
			m_numTierUnlocked = 0;
			m_bPremiumUser = false;
			m_nActiveCardIndex = -1;
			m_numRedeemableBalance = 0;
		}

		_AddLoopingRewardsToDisplay();

		                                                 
		                                                            
		                                                          
		                                                            
		                                                  
		                                         
		                                 
		                                                  
		                                                                  

		return true;
	};

	var _AddLoopingRewardsToDisplay = function()
	{
		                                    
		if ( m_nLoopingRewardsCount > 0 )
		{	                                                
			m_nRewardsCount += m_nLoopingRewardsCount;
			                                                                        
			while ( m_numTierUnlocked > m_nRewardsCount - m_nLoopingRewardsCount )
			{
				m_nRewardsCount += m_nLoopingRewardsCount;
			}
		}
	};

	var _GetObjValue= function( bHasStoreItems, rewardIndex, item )
	{
		                     
		var data;
		
		if( bHasStoreItems )
		{
			data = MissionsAPI.GetSeasonalOperationRedeemableGoodsSchema( m_nSeasonAccess, rewardIndex, item.value );
		}
		else
		{
			data = MissionsAPI.GetSeasonalOperationTrackRewardSchema( m_nSeasonAccess, rewardIndex, item.value );
		}

		                                                                                          
		if( item.value === 'ui_order')
		{
			return data ? data : '';
		}
		else{
			return data;
		}
	};

	var _GetContainerTypeForReward = function( oRewardData )
	{
		var rewardId = oRewardData.itempremium.ids[ 0 ];
		
		var toolsKey = InventoryAPI.GetRawDefinitionKey( rewardId, "inv_container_and_tools" ); 

		                                  

		if( ( toolsKey === "weapon_case" ) )
		{
			return 'isWeaponsCase';
		}
		else if ( toolsKey === "graffiti_box" ){
			return 'isGraffitiBox';
		}
		else if( InventoryAPI.GetRawDefinitionKey( rewardId, "item_type" ) === "operation_coin" )
		{
			return 'isCoin';
		}
		else if( ItemInfo.IsCharacter( oRewardData.lootlist[0] ) )
		{
			return 'isCharacterLootlist';
		}
		else if( ItemInfo.IsWeapon( oRewardData.lootlist[0] ) )
		{
			return 'isWeaponLootlist';
		}

		return 'isStickerLootlist';
	};

	var _GetRewardsData = function()
	{
		                                    
		if ( !m_nSeasonAccess || m_nSeasonAccess === -1 )
		{
			return;
		}
		var bHasStoreItems = _HasStoreItems();
		var nRewardsCount  = bHasStoreItems ? m_nRedeemableGoodsCount : m_nRewardsCount;
		                                                              

		var aRewardDataFields = [
			{ objHandle:'points', value: 'points'},
			{ objHandle:'uiOrder', value: 'ui_order'},
			{ objHandle:'imagePath', value: 'ui_image'},
			{ objHandle:'imagePathInspect', value: 'ui_image_inspect'},
			{ objHandle:'imagePathThumbnail', value: 'ui_image_thumbnail'},
			{ objHandle:'RewardItemsNames', value: 'item_name'},
			{ objHandle:'FreeRewardItemsNames', value: 'item_name_free'},
			{ objHandle:'useAsCallout', value: 'callout'},
			{ objHandle:'isGap', value: 'none'},
			{ objHandle:'lootlist', value: []},
			{ containerType:'' }
		];

		var _allRewardsData = [];

		for ( var i = 0; i < nRewardsCount; i++ )
		{
			var _rewardData = {};
			_rewardData.idx = i;
			_rewardData.rnd = Math.random();

			aRewardDataFields.forEach(function( item, index ) 
			{
				                                              
				_rewardData[item.objHandle] = _GetObjValue( bHasStoreItems, i, item );
			});

			                                                                                                                                  
			                                                                                                                 
			                                                                             
			                                                                                                           
			                                              
			var rewardTypes = [
				{ type: 'premium', names: _rewardData.RewardItemsNames },
				{ type: 'free', names: _rewardData.FreeRewardItemsNames }
			];

			rewardTypes.forEach( rType =>
			{
				if( !rType.names )
				{
					rType.names = '';
				}
				
				var items = { type: rType.type, ids: [] };
				var nameList = rType.names.split( ',' );
				nameList.forEach( reward =>
				{
					if ( reward )
					{
						var itemidForReward;
						if ( reward.startsWith( 'lootlist:' ) )
						{                                               
							itemidForReward = InventoryAPI.GetLootListItemIdByIndex( reward, 0 );
						} else
						{	                                                  
							var nDefinitionIndex = InventoryAPI.GetItemDefinitionIndexFromDefinitionName( reward );
							itemidForReward = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( nDefinitionIndex, 0 );
						}
						items.ids.push( itemidForReward );
					}
				} );

				_rewardData[ 'item' + rType.type ] = items;
			} );
			
			_rewardData.lootlist = _GetLootListForReward( _rewardData.itempremium.ids[ 0 ] );
			_rewardData.containerType = _GetContainerTypeForReward( _rewardData );

			_allRewardsData.push( _rewardData );
		}

		return _allRewardsData;
	};

	var _GetLootListForReward = function( rewardId )
	{
		var count = ItemInfo.GetLootListCount( rewardId );
		var itemsList = [];
		if ( !count )
		{
			itemsList.push( rewardId );
		}
		else
		{
			for ( var i = 0; i < count; i++ )
			{
				  
				                                                                
				                                                              
				                            
				  
				var itemId = ItemInfo.GetLootListItemByIndex( rewardId, i );
				if ( InventoryAPI.DoesItemMatchDefinitionByName( itemId, 'spraypaint' ) || InventoryAPI.DoesItemMatchDefinitionByName( itemId, 'spray' ) )
				{
					itemId = InventoryAPI.GenerateSprayTintedItemID( itemId );
				}
				itemsList.push( itemId );
			}
		}

		return itemsList;
	};

	var _GettotalPointsFromAvailableFromMissions = function()
	{
		var cardCount =  MissionsAPI.GetSeasonalOperationMissionCardsCount( m_nSeasonAccess );
		var totalPoints = 0;

		for ( var i = 0; i < cardCount; i++ )
		{
			var jsoCardDetails = MissionsAPI.GetSeasonalOperationMissionCardDetails( m_nSeasonAccess, i );

			if ( !jsoCardDetails )
			{
				return;
			}

			totalPoints += jsoCardDetails.operational_points;

			                                                                                 
			   	                                                  
			   	                                                                                             
			   		                                                   
			    
		}

		return totalPoints;
	};

	function _OpenPopupCustomLayoutOperationHub ( rewardIdxToSetWhenOpen )
	{
		var nActiveSeason = GameTypesAPI.GetActiveSeasionIndexValue();
		if ( nActiveSeason < 0 )
			return;

		var elPanel = UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/operation/operation_main.xml',
			'none'
		);
		$.DispatchEvent( 'PlaySoundEffect', 'tab_mainmenu_inventory', 'MOUSE' );

		elPanel.SetAttributeInt( "season_access", nActiveSeason );
		if ( rewardIdxToSetWhenOpen > -1 )
		{
			elPanel.SetAttributeInt( "start_reward", rewardIdxToSetWhenOpen );
		}
	}

	function _OpenPopupCustomLayoutOperationStore()
	{
		var nActiveSeason = GameTypesAPI.GetActiveSeasionIndexValue();
		if ( nActiveSeason < 0 )
			return;

		$.DispatchEvent( 'ContextMenuEvent', '' );

		var elPanel = UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/operation/operation_store.xml',
			'none'
		);

		elPanel.SetAttributeInt( "season_access", nActiveSeason );
		$.DispatchEvent( 'PlaySoundEffect', 'tab_mainmenu_inventory', 'MOUSE' );
	}

	function _OpenUpSell( starsNeeded = 0, bForceOpenStarsPurchase = false )
	{
		function _OpenStarStore()
		{
			var elPopup = UiToolkitAPI.ShowCustomLayoutPopupParameters(
				'',
				'file://{resources}/layout/popups/popup_operation_store.xml',
				'bluroperationpanel=true',
				'none'
			);

			elPopup.SetAttributeInt( "starsneeded", starsNeeded );
			                                                              
			
			var oOldStarsActivate = _UpdateOldStars();
			                                                                                                                                                            
			if ( oOldStarsActivate.ids.length > 0 )
			{
				elPopup.SetAttributeString( "oldstarstoactivate", oOldStarsActivate.ids.join( ',' ) );
				elPopup.SetAttributeInt( "oldstarstoactivatevalue", oOldStarsActivate.value );
			}
		}

		function _OpenStoreForPass( passId )
		{
			if( passId )
			{
				UiToolkitAPI.ShowCustomLayoutPopupParameters(
					'',
					'file://{resources}/layout/popups/popup_inventory_inspect.xml',
					'itemid=' + passId +
					'&' + 'asyncworktype=useitem' + 
					'&' + 'seasonpass=true' +
					'&' + 'bluroperationpanel=true'
				);
				return;
			}
			
			var passDefIndex = _GetPassFauxId();
			UiToolkitAPI.ShowCustomLayoutPopupParameters(
				'',
				'file://{resources}/layout/popups/popup_inventory_inspect.xml',
				'itemid=' + passDefIndex +
				'&' + 'inspectonly=false' +
				'&' + 'asyncworkitemwarning=no' +
				'&' + 'bluroperationpanel=true' +
				'&' + 'storeitemid=' + passDefIndex +
				'&' + 'overridepurchasemultiple=0',
				'none'
			);

			                                                               
			                                                    
			var nSourceLayoutId = 0;
			var strSourceLayoutFile = $.GetContextPanel().layoutfile;
			if ( strSourceLayoutFile.endsWith( "operation_mainmenu.xml" ) )
			{
				nSourceLayoutId = 1; 
			}
			else if ( strSourceLayoutFile.endsWith( "operation_main.xml" ) )
			{
				nSourceLayoutId = 2; 
			}
			StoreAPI.RecordUIEvent( "OperationJournal_Purchase", nSourceLayoutId );
		}

		$.DispatchEvent( 'PlaySoundEffect', 'tab_mainmenu_inventory', 'MOUSE' );
		var passId = InventoryAPI.GetActiveSeasonPassItemId();

		if (( m_bPremiumUser || bForceOpenStarsPurchase ))
		{
			_OpenStarStore();
		}
		else
		{
			_OpenStoreForPass( passId );
		}
	}

	var _GetPassFauxId = function()
	{
		return  InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( m_passStoreId, 0 );
	};

	var _GetCoinDefIdxArray = function()
	{
		return m_aCoinDefIndexes;
	}

	var _GetOperationStarDefIdxArray = function()
	{
		return m_aStarDefIndexes;
	}

	var _UpdateOldStars = function()
	{
		var oDefNames = [ {},{},{} ];
		oDefNames[0] = {def:InventoryAPI.GetItemDefinitionName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( m_aStarDefIndexes[0], 0 )),value:1};
		oDefNames[1] = {def:InventoryAPI.GetItemDefinitionName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( m_aStarDefIndexes[1], 0 )),value:10};
		oDefNames[2] = {def:InventoryAPI.GetItemDefinitionName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( m_aStarDefIndexes[2], 0 )),value:100};

		var oTotalStars = { ids: [], value: 0 };
		oDefNames.forEach( element =>
		{
			InventoryAPI.SetInventorySortAndFilters( 'inv_sort_age', false, 'item_definition:' + element.def, '', '' );
			var count = InventoryAPI.GetInventoryCount();
			for ( var i = 0; i < count; i++ )
			{
				oTotalStars.ids.push( InventoryAPI.GetInventoryItemIDByIndex( i ) );
				oTotalStars.value += element.value;
			}
		} );

		return oTotalStars;
	};
	
	var gameElementDetails = {
		exojump: {
			icon: "file://{images}/icons/ui/exojump_hud.svg",
			name: "Survival_SpawnEquip_exojump",
			tooltip: ""
		},
		breachcharge: {
			icon: "file://{images}/icons/equipment/breachcharge.svg",
			name: "SFUI_WPNHUD_BreachCharge",
			tooltip: ""
		},
		parachute: {
			icon: "file://{images}/icons/ui/parachute.svg",
			name: "Survival_SpawnEquip_parachute",
			tooltip: ""
		},
		bumpmine: {
			icon: "file://{images}/icons/equipment/bumpmine.svg",
			name: "SFUI_WPNHUD_BumpMine",
			tooltip: ""
		},
	};

	var _MissionsThatMatchYourMatchMakingSettings = function( SessionGameMode, sessionMaps, nSeasonAccess )
	{
		                                                                                              

		var numMissionCards = MissionsAPI.GetSeasonalOperationMissionCardsCount( nSeasonAccess );
		for ( var i = 0; i < numMissionCards; ++ i )
		{
			var jsoCardDetails = MissionsAPI.GetSeasonalOperationMissionCardDetails( nSeasonAccess, i );
			_GetMatchingMission( i, jsoCardDetails, SessionGameMode, sessionMaps );
		}
	};

	var _GetMatchingMission = function( idx, jsoCardDetails, SessionGameMode, sessionMaps )
	{
		var oMatchingMissions = {};
		for ( var iMission = 0; iMission < jsoCardDetails.quests.length; ++iMission )
		{
			var MissionItemID = InventoryAPI.GetQuestItemIDFromQuestID( Number( jsoCardDetails.quests[ iMission ] ) );
			var gameMode = InventoryAPI.GetQuestGameMode( MissionItemID );
			var mapGroup = InventoryAPI.GetQuestMapGroup( MissionItemID );

			if ( !mapGroup )
			{	                                                                               
				mapGroup = 'mg_' + InventoryAPI.GetQuestMap( MissionItemID );
			}

			if ( SessionGameMode === gameMode &&
				_HasMatchtingMapGroup( sessionMaps, mapGroup ) &&
				jsoCardDetails.isunlocked &&
				MissionsAPI.GetQuestPoints( jsoCardDetails.quests[ iMission ], "remaining" ) === 0 )
			{
				if ( !oMatchingMissions.hasOwnProperty( 'card' + idx ) )
				{
					oMatchingMissions[ 'card' + idx ] = idx;
					oMatchingMissions.missions = [];
				}
				
				oMatchingMissions.missions.push( MissionItemID );
			}
		}

		return oMatchingMissions;
	};

	var _IsMissionLockedBehindPremiumOperationPass = function( missionCardId, MissionItemID, nSeasonAccess )
	{
		                                                                                          
		var gameMode = InventoryAPI.GetQuestGameMode( MissionItemID );
		if ( gameMode !== 'competitive' )
			return false;

		var mapGroup = InventoryAPI.GetQuestMapGroup( MissionItemID );
		if ( !mapGroup )
		{
			mapGroup = 'mg_' + InventoryAPI.GetQuestMap( MissionItemID );
		}
		if ( mapGroup !== 'mg_lobby_mapveto' )
			return false;

		                                                    
		if ( _ValidateOperationInfo( nSeasonAccess ) && m_bPremiumUser )
			return false;
		
		return true;
	}

	var _HasMatchtingMapGroup = function( sessionMaps, mapGroup )
	{
		return sessionMaps.filter( element => mapGroup.includes( element ) ).length > 0 ? true : false;
	};

	                                                                                           
	var _GetQuestGameElements = function( questID )
	{
		return MissionsAPI.GetQuestGameElements( questID ).map( elem => gameElementDetails[ elem ] );
	};

	var _HasStoreItems = function ( )
	{
		return m_nRedeemableGoodsCount > 0 && m_nRedeemableGoodsCount !== null && m_nRedeemableGoodsCount != undefined ? true : false;
	};

	var _UnblurMenu = function( elPanel )
	{
		elPanel.SetHasClass( 'blur', false );
	};

	var _BlurMenu = function( elPanel)
	{
		elPanel.SetHasClass( 'blur', true );
	};

	var _ValidateCoinAndSeasonIndex = function( nSeasonAccess, nCoinRank )
	{
		if ( nSeasonAccess === -1 ||
			!nSeasonAccess ||
			nCoinRank === -1 ||
			nCoinRank === undefined ||
			nCoinRank === null )
		{
			return false;
		}

		return true;
	};


	var _GetOperationInfo = function()
	{
		return {
			nSeasonAccess: m_nSeasonAccess,
			nTierUnlocked: m_numTierUnlocked,
			nRewardsCount: m_nRewardsCount,
			bShopIsFreeForAll: false,
			nRedeemableGoodsCount: m_nRedeemableGoodsCount,
			nRedeemableBalance : m_numRedeemableBalance,
			nMissionsCompleted: m_numMissionsCompleted,
			nMissionsRewardThresholds: m_numMissionsRewardThresholds,
			bPremiumUser: m_bPremiumUser,
			nCoinRank: m_nCoinRank,
			nActiveCardIndex: m_nActiveCardIndex,
			bPrime: m_bPrime
		};
	};

	return {
		ValidateOperationInfo: _ValidateOperationInfo,
		ValidateCoinAndSeasonIndex: _ValidateCoinAndSeasonIndex,
		GetOperationInfo: _GetOperationInfo,
		GetRewardsData: _GetRewardsData,
		GetLootListForReward: _GetLootListForReward,
		OpenPopupCustomLayoutOperationHub: _OpenPopupCustomLayoutOperationHub,
		OpenPopupCustomLayoutOperationStore: _OpenPopupCustomLayoutOperationStore,
		IsMissionLockedBehindPremiumOperationPass: _IsMissionLockedBehindPremiumOperationPass,
		OpenUpSell: _OpenUpSell,
		GetQuestGameElements: _GetQuestGameElements,
		UpdateOldStars: _UpdateOldStars,
		GetPassFauxId: _GetPassFauxId,
		GetCoinDefIdxArray : _GetCoinDefIdxArray,
		GetOperationStarDefIdxArray: _GetOperationStarDefIdxArray,
		GettotalPointsFromAvailableFromMissions: _GettotalPointsFromAvailableFromMissions,
		MissionsThatMatchYourMatchMakingSettings: _MissionsThatMatchYourMatchMakingSettings,
		BlurMenu: _BlurMenu,
		UnblurMenu: _UnblurMenu
	};

})();
