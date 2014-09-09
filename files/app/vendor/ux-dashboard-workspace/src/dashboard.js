"use strict";
(function () {

    var _$safeApply = null;
    var getSetDataQueryStateFn = function (widgetScope) {
        widgetScope.loadingCount = 0;
        return function (state) {
            switch (state) {
                case "done":
                    widgetScope.loadingCount = Math.max(widgetScope.loadingCount - 1, 0);
                    break;
                case "loading":
                    widgetScope.loadingCount++;
                    break;
                case "datamissing":
                    widgetScope.loadingCount = -1;
                    break;
                default:

            }
            _$safeApply(widgetScope);
        };
    }

    angular.module('uxDashboardworkspace', ['SafeApply', 'ngAnimate', 'uxRightClick'])
        .run(['$safeApply', function ($safeApply) {
            _$safeApply = $safeApply;
        }])
        .directive('uxDashboardworkspace', function ($http) {
            return {
                restrict: 'E',
                template: '<div class="sgwPnl ux-dashboardworkspace" locked="{{!state.dashboardUnlocked}}" managing="{{state.showDashboardManage}}">\
                    <div class="sgwPnlHeader" uib-attr="" ng-bind="dashboardtitle">\
                    </div>\
                    <button class="dashboardManageBtn" ng-class="{true:\'on\'}[state.showDashboardManage]" ng-click="toggleManageDashBoard()" ng-bind-template="{{{false:\'Add widgets\', true:\'Done\'}[state.showDashboardManage]}}">Add widgets</button>\
                    <a ng-if="false" class="dashboardBtn addWidgetBtn"  ng-class="{true:\'on\'}[state.showDashboardManage]" ng-click="toggleManageDashBoard()">\
                        <i class="fa fa-gears"></i>\
                    </a>\
                    <a class="dashboardBtn dashboardLockBtn" title="{{{true:\'Lock the dashboard\', false:\'Unlock to edit the dashboard widgets\'}[state.dashboardUnlocked]}}" ng-class="{true:\'on\'}[state.dashboardUnlocked]" ng-click="toggleDashBoardState()">\
                        <i class="fa" ng-class="{true:\'fa-unlock\', false:\'fa-lock\'}[state.dashboardUnlocked]"></i>\
                    </a>\
                    <div class="sgwPnlBody">\
                        <dashboard></dashboard>\
                    </div>\
                </div>',
                replace: true,
                scope: {
                    dashboardtitle: '@',
                    autogrowCols: '@'
                },
                link: function (scope, element, attrs) {
                    scope.state = {
                        showDashboardManage: false,
                        dashboardUnlocked: false
                    }
                    scope.toggleManageDashBoard = function () {
                        scope.state.showDashboardManage = !scope.state.showDashboardManage;
                        scope.$broadcast('toggleManageDashBoard', scope.state.showDashboardManage);
                    }
                    scope.toggleDashBoardState = function () {
                        scope.state.dashboardUnlocked = !scope.state.dashboardUnlocked;
                        scope.$broadcast('toggleDashBoardState', scope.state.dashboardUnlocked);
                    }
                    $http.get(attrs.widgetsUrl).
                       success(function (data, status, headers, config) {
                           if (data && data.widgets) {

							   var loadSuccess = function (data, status, headers, config) {
                                   if (!data.widgets) {
                                       data = {
                                           widgets: []
                                       }
                                   }
                                   for (var i = 0; i < data.widgets.length; i++) {
                                       var widget = data.widgets[i];
                                       var widgetConfig = widgetsConfigById[widget.id];
                                       if (widgetConfig)
                                           data.widgets[i] = $.extend(true, {}, widgetConfig, widget);
                                   }
                                   scope.dashboardData = data;
                                   scope.$broadcast('dashboardDataReceived');
                               };

                               scope.dashboardConfig = data;
                               var widgetsConfigById = {};
                               for (var i = 0; i < data.widgets.length; i++) {
                                   var widget = data.widgets[i];
                                   widgetsConfigById[widget.id] = widget;
                               }
                               var loadFailover = function () {
                                   scope.dashboardData = {
                                       widgets: []
                                   }
                                   scope.$broadcast('dashboardDataReceived');
                               }
                               if (data.storageUrl) {
								   
                                   $http.get(data.storageUrl).
								   		success(function (data, status, headers, config) { 
											loadSuccess(data); 
										}).
										error(loadFailover);
								   
							   } else if (window.localStorage && data.localStorageKey && data.localStorageDefaultUrl) {
								   
								   var item = window.localStorage.getItem(data.localStorageKey);
								   if (item) {
								   		loadSuccess(JSON.parse(item));
								   } else {
								   		$http.get(data.localStorageDefaultUrl).
											success(function (data, status, headers, config) { 
												loadSuccess(data); 
											}).
											error(loadFailover);
								   }
									   
                               } else
                                   loadFailover();
                           }
                       });

                    var saveDashBoardData = function () {
                        if (!scope.dashboardConfig.storageUrl && !(window.localStorage && scope.dashboardConfig.localStorageKey && scope.dashboardConfig.localStorageDefaultUrl))
                            return;
                        var gridsterSerialization = scope.gridsterSerialization();
                        if (!gridsterSerialization)
                            return;
                        var gridsterSerializationById = {};
                        for (var i = 0; i < gridsterSerialization.length; i++) {
                            var gridsterWidgetSerialization = gridsterSerialization[i];
                            gridsterSerializationById[gridsterWidgetSerialization.widgetId] = gridsterWidgetSerialization;
                        }
                        var dashboardData2save = { widgets: [] };
                        scope.dashboardData.widgets.forEach(function (wData) {
                            var gridsterWidgetSerialization = gridsterSerializationById[wData.uniqueId];
                            var widgetData2save = {
                                id: wData.id,
                                title: wData.title,
                                style: wData.style,
                                widgetUserPreferences: wData.widgetUserPreferences,
                                size: {
                                    height: gridsterWidgetSerialization.size_y,
                                    width: gridsterWidgetSerialization.size_x
                                },
                                position: {
                                    x: gridsterWidgetSerialization.col,
                                    y: gridsterWidgetSerialization.row
                                }
                            }
                            dashboardData2save.widgets.push(widgetData2save)
                        })
						
						if (scope.dashboardConfig.storageUrl) {
							
                        	$http.post(scope.dashboardConfig.storageUrl, JSON.stringify(dashboardData2save));

					   	} else if (window.localStorage && scope.dashboardConfig.localStorageKey && scope.dashboardConfig.localStorageDefaultUrl) {
					   
					   	 	window.localStorage.setItem(scope.dashboardConfig.localStorageKey, JSON.stringify(dashboardData2save));
					   
	                    }
					};

                    var saveDashBoardDataTimeout = null;
                    scope.$on('saveDashBoardData', function () {
                        clearTimeout(saveDashBoardDataTimeout);
                        saveDashBoardDataTimeout = setTimeout(saveDashBoardData, 500);
                    });
                }
            }
        })
        .directive('dashboard', ['$compile', '$safeApply', function ($compile, $safeApply) {
            return {
                restrict: 'E',
                template: '<div class="uib-dashboard gridster">\
                        <ul ng-class="{true:\'lockHeight\'}[state.showDashboardManage]"/>\
                        <div class="uib-dashboard-manage" dashboard-manage ng-show="state.showDashboardManage"/>\
                   </div>',
                replace: true,
                require: 'dashboard',
                controller: function ($scope, $element, $attrs) {
                    var gridster;
                    var widgets = {};

                    var updateWidgetResizableState = function (widgetScope, $widget) {
                        var widgetcol = Number($widget.attr('data-sizex')),
                        widgetrow = Number($widget.attr('data-sizey'));

                        var canResize = widgetScope.widgetData.capabilities.resize,
                            minSize = widgetScope.widgetData.size.min,
                            maxSize = widgetScope.widgetData.size.max;

                        var canGoLeft = false,
                            canGoRight = false,
                            canGoUp = false,
                            canGoDown = false;

                        if (canResize) {
                            if (widgetcol > 1)
                                canGoLeft = minSize ? minSize.width < widgetcol : true;
                            canGoRight = maxSize ? maxSize.width > widgetcol : true;
                            if (widgetrow > 1)
                                canGoUp = minSize ? minSize.height < widgetrow : true;
                            canGoDown = maxSize ? maxSize.height > widgetrow : true;
                        }
                        var resizable = (canGoUp ? 'n' : '') + (canGoDown ? 's' : '') + (canGoRight ? 'e' : '') + (canGoLeft ? 'o' : '');
                        $widget.attr('resizable', resizable);
                    }

                    var addWidgetFromData = function (widgetData) {
                        widgetData.uniqueId = widgetData.id + "_" + Math.random().toString(36).substr(2);
                        var widgetTemplate = '<li class="dashboard-widget" widget-id="' + widgetData.uniqueId + '"/>';
                        var widgetparams = [widgetTemplate, widgetData.size.width, widgetData.size.height];
                        if (widgetData.position) {
                            widgetparams.push(widgetData.position.x);
                            widgetparams.push(widgetData.position.y)
                        }
                        var widget = gridster.add_widget.apply(gridster, widgetparams);
                        var rnd = (Math.random() * 200) + "ms";
                        widget[0].style.animationDelay = widget[0].style.webkitAnimationDelay = rnd;

                        if (widgetData.size.min)
                            gridster.set_widget_min_size.call(gridster, widget, [widgetData.size.min.width, widgetData.size.min.height]);
                        if (widgetData.size.max)
                            gridster.set_widget_max_size.call(gridster, widget, [widgetData.size.max.width, widgetData.size.max.height]);

                        var widgetScope = $scope.$new(true);
                        widgetScope.widgetData = widgetData;
                        widgetScope.pageScope = $scope.$parent;
                        widgetScope.dashboardConfig = $scope.dashboardConfig;
                        widgetScope.dashboardState = $scope.state;
                        widgetScope.setDataQueryState = getSetDataQueryStateFn(widgetScope);

                        widgets[widgetData.uniqueId] = { data: widgetData, widget: widget, scope: widgetScope };
                        updateWidgetResizableState(widgetScope, widget);
                        $compile(widget)(widgetScope);
                    }

                    $scope.gridsterSerialization = function () {
                        if (!gridster)
                            return null;
                        return gridster.serialize();
                    }
                    /*
                    var resizeGridster = function () {
                        if (gridster) {
                            gridster.generate_grid_and_stylesheet();
                        }
                    }
    
                    var resize_event = 'resize.' + Date.now();
                    $(window).on(resize_event, resizeGridster);
                    $scope.$on('$destroy', function () {
                        $(window).off(resize_event);
                    });
                    */
                    this.initialize = function () {
                        var gridsterUl = $element.find('ul')[0];
                        gridster = $(gridsterUl).gridster({
                            widget_selector: '.dashboard-widget',
                            widget_margins: $scope.dashboardConfig.widget_margins,
                            widget_base_dimensions: $scope.dashboardConfig.widget_base_dimensions,
                            helper: 'clone',
                            autogrow_cols: !!$scope.autogrowCols,
                            serialize_params: function ($w, wgd) {
                                return { col: wgd.col, row: wgd.row, size_x: wgd.size_x, size_y: wgd.size_y, widgetId: $w.attr('widget-id') };
                            },
                            draggable: {
                                stop: function () { $scope.$emit('saveDashBoardData'); },
                                handle: '.dashboard-widget-header,.dashboard-widget-header-title'
                            },
                            resize: {
                                resize: function (e, ui, $widget) {
                                    //debugger;
                                    var widgetScope = widgets[$widget.attr('widget-id')].scope;
                                    widgetScope.$broadcast('widget-resizing', $widget);
                                    updateWidgetResizableState(widgetScope, $widget);
                                },
                                stop: function (e, ui, $widget) {
                                    widgets[$widget.attr('widget-id')].scope.$broadcast('widget-resized', $widget);
                                    $scope.$emit('saveDashBoardData');
                                },
                                enabled: true
                            }
                        }).data('gridster');

                        for (var i = 0; i < $scope.dashboardData.widgets.length; i++) {
                            addWidgetFromData($scope.dashboardData.widgets[i]);
                        }

                        updateUnlockState();
                    }

                    //widget-resize

                    this.removeWidget = function (widgetId) {
                        var widgetInfo = widgets[widgetId];
                        delete widgets[widgetId];
                        var widgetDataIndex = $scope.dashboardData.widgets.indexOf(widgetInfo.data);
                        $scope.dashboardData.widgets.splice(widgetDataIndex, 1);
                        gridster.remove_widget.call(gridster, widgetInfo.widget);
                        $scope.$emit('saveDashBoardData');
                    }

                    this.addWidget = function (widgetId) {
                        var widgetConfig = $scope.dashboardConfig.widgets.filter(function (w) { return w.id == widgetId });
                        if (widgetConfig.length == 0)
                            return;
                        widgetConfig = widgetConfig[0];

                        var widgetdata = $.extend(true, {}, widgetConfig);;
                        $scope.dashboardData.widgets.push(widgetdata);
                        addWidgetFromData(widgetdata);
                        $scope.$emit('saveDashBoardData');
                    }

                    var updateUnlockState = function () {
                        if (gridster)
                            if ($scope.state.dashboardUnlocked) {
                                gridster.enable_resize();
                                gridster.enable()
                            } else {
                                gridster.disable_resize();
                                gridster.disable()
                            }

                    }
                    $scope.$watch('state.dashboardUnlocked', updateUnlockState);
                },
                link: function (scope, element, attrs, dashboardCtrl) {
                    scope.$on('toggleManageDashBoard', function (e, showDashboardManage) {
                        scope.state.showDashboardManage = showDashboardManage;
                    });
                    scope.$on('dashboardDataReceived', function () {
                        dashboardCtrl.initialize();
                    });
                }
            }
        }])
        .directive('dashboardWidget', function ($compile, $animate) {
            return {
                restrict: 'C',
                template: '<div class="dashboard-widget-header" ng-if="!template">\
                        <div class="dashboard-widget-header-title" ng-if="!dashboardState.dashboardUnlocked" spellcheck="false" ng-model="widgetData.title" title="Click to edit" contenteditable uib-contenteditable  ng-change="titleEdited()"></div>\
                        <div class="dashboard-widget-header-title" ng-if="dashboardState.dashboardUnlocked" ng-bind="widgetData.title"></div>\
                        <ul class="dashboard-widget-header-color-picker" >\
                            <li class="color_pick" ng-if="!dashboardState.dashboardUnlocked">\
                                <a ng-click="pickColor()"><i class="fa fa-th"></i></a>\
                                <ul class="colorList" ng-show="state.colorPickerVisible">\
                                    <li ng-repeat="color in dashboardConfig.colors"><a ng-class="color" ng-click="setColor(color)"></a></li>\
                                </ul>\
                            </li>\
                            <li ng-if="widgetData.capabilities.reload" ng-show="!dashboardState.dashboardUnlocked"><a ng-click="reloadWidget()"><i class="fa fa-rotate-right"></i></a></li>\
                            <li ng-if="widgetData.capabilities.configure" ng-show="!dashboardState.dashboardUnlocked"><a ng-click="openConfig()"><i class="fa fa-gear"></i></a></li>\
                            <li ng-if="viewmode==\'normal\' && widgetData.capabilities.fullscreen" ng-show="!dashboardState.dashboardUnlocked"><a ng-click="gotoFullScreenView()"><i style="font-size: 19px;padding-top: 11px;-webkit-transform: scaleY(.9);" class="fa fa-square-o"></i></a></li>\
                            <li ng-show="viewmode==\'normal\' && dashboardState.dashboardUnlocked"><a ng-click="removeWidget()"><i class="fa fa-times"></i></a></li>\
                            <li ng-show="viewmode==\'fullscreen\'"><a ng-click="gotoNormalView()"><i class="fa fa-arrow-down uib-dashboard-gotoNormalView-icon"></i></a></li>\
                        </ul>\
                    </div>\
                    <div class="dashboard-widget-body-container">\
                        <div class="dashboard-widget-body">\
                        </div>\
                        <div class="dashboard-widget-data-state-loading" ng-if="loadingCount>0">\
                            <i class="fa fa-spinner fa-spin fa-2x"></i>\
                        </div>\
                        <div class="dashboard-widget-data-state-missing" ng-if="loadingCount<0">\
                            No data available\
                        </div>\
                    </div>\
                    <span class="gs-resize-handle gs-resize-handle-both" ng-if="!template && true">\
                        <span class="uib-dashboard-resize-corner">\
                            <span class="uib-dashboard-resize-corner-triangle uib-dashboard-resize-corner-triangle-color uib-dashboard-resize-corner-triangle1"></span>\
                            <span class="uib-dashboard-resize-corner-triangle uib-dashboard-resize-corner-triangle-bkg uib-dashboard-resize-corner-triangle2"></span>\
                            <span class="uib-dashboard-resize-corner-triangle uib-dashboard-resize-corner-triangle-col uib-dashboard-resize-corner-triangle3"></span>\
                            <span class="uib-dashboard-resize-corner-triangle uib-dashboard-resize-corner-triangle-bkg uib-dashboard-resize-corner-triangle4"></span>\
                            <span class="uib-dashboard-resize-corner-triangle uib-dashboard-resize-corner-triangle-col uib-dashboard-resize-corner-triangle5"></span>\
                            <span class="uib-dashboard-resize-corner-triangle uib-dashboard-resize-corner-triangle-bkg uib-dashboard-resize-corner-triangle6"></span>\
                        </span>\
                    </span>\
                    <div class="dashboard-widget-details" ng-if="template">\
                        <div class="dashboard-widget-title" ng-bind="widgetData.title"></div>\
                        <div class="dashboard-widget-description" ng-bind="widgetData.description"></div>\
                        <button ng-if="!present || allowMultipleAdd" class="dashboard-widget-add-button" ng-click="addWidget(present)">Add</button>\
                        <button ng-if="present && !allowMultipleAdd" class="dashboard-widget-added-button" disabled="disabled">Added to the dashboard</button>\
                    </div>',
                /*<div ng-if="template" ng-click="toggleWidgetAvailability(present)" class="dashboard-widget-template-cover" ng-class="{true:\'remove\', false:\'add\'}[present]"><div class="dashboard-widget-template-cover-icon"/></div>',
                */
                require: ['^dashboard', 'dashboardWidget'],
                controller: function ($scope, $element, $attrs) {
                    this.sizex = function () {
                        return Number(this.$element.attr('data-sizex'));
                    }
                    this.sizey = function () {
                        return Number(this.$element.attr('data-sizey'));
                    }
                },
                compile: function ($element, $attrs) {
                    return function (scope, element, attrs, ctrls) {
                        var dashboardCtrl = ctrls[0];
                        var dashboardWidget = ctrls[1];
                        dashboardWidget.data = scope.widgetData;
                        dashboardWidget.$element = $element;

                        scope.viewmode = "normal";
                        var widgetBody = element.children('.dashboard-widget-body-container').children('.dashboard-widget-body');
                        if (scope.fixedWidgetHeight)
                            widgetBody.css('height', scope.fixedWidgetHeight + "px");

                        var instanciateWigetDirective = function () {
                            widgetBody.empty();
                            var widgetDirectiveName = scope.widgetData.directive.replace(/([A-Z])/g, function (m) { return "-" + m.toLowerCase() });
                            var widget2compile = $('<div class="dashboard-widget-directive ' + widgetDirectiveName + '"/>').appendTo(widgetBody);
                            $compile(widget2compile)(scope);
                        }

                        instanciateWigetDirective();

                        element.addClass(scope.widgetData.style.color);
                        scope.state = { colorPickerVisiblecolorPickerVisible: false };

                        scope.addWidget = function () {
                            dashboardCtrl.addWidget(scope.widgetData.id);
                            scope.present = true;

                            //                    throw "todo: put elsewhere than on the button that is getting hidden";
                            var widgetDetails = element.find('.dashboard-widget-details');
                            var addedMsg = $('<span class="dashboard-widget-add-button-addedmsg">Added!</span>').appendTo(widgetDetails);

                            setTimeout(function () {
                                $animate.addClass(addedMsg, "fade-up", function () {
                                    addedMsg.remove();
                                });
                            });
                        }

                        scope.pickColor = function () {
                            scope.state.colorPickerVisible = !scope.state.colorPickerVisible;
                        }

                        scope.openConfig = function () {
                            scope.$broadcast('widget-openconfiguration');
                        }

                        scope.gotoNormalView = function () {
                            scope.$broadcast('widget-normalview-start');
                            scope.viewmode = "normal";
                            $animate.removeClass(element, "widgetFullScreenView", function () {
                                element.attr('style', element.data('normalViewStyle') + ";transition-duration:0ms");
                                setTimeout(function () {
                                    element.attr('style', element.data('normalViewStyle'));
                                    scope.$broadcast('widget-normalview');
                                }, 0);
                            });
                        }

                        scope.gotoFullScreenView = function () {
                            scope.$broadcast('widget-fullscreenview-start');
                            var boundingClientRect = element[0].getBoundingClientRect();
                            element.data('normalViewStyle', element.attr('style'));
                            element.css({
                                width: boundingClientRect.width,
                                height: boundingClientRect.height,
                                top: boundingClientRect.top,
                                left: boundingClientRect.left,
                                position: 'fixed'
                            })
                            scope.viewmode = "fullscreen";
                            $animate.addClass(element, "widgetFullScreenView", function () {
                                scope.$broadcast('widget-fullscreenview');
                            });
                        }

                        scope.reloadWidget = function () {
                            instanciateWigetDirective();
                        }

                        scope.removeWidget = function () {
                            dashboardCtrl.removeWidget(scope.widgetData.uniqueId);
                        }

                        scope.titleEdited = function () {
                            scope.$emit('saveDashBoardData');
                        }

                        scope.$watch('widgetData.widgetUserPreferences', function () {
                            scope.$emit('saveDashBoardData');
                        })

                        scope.setColor = function (newColor) {
                            element.removeClass(scope.widgetData.style.color);
                            scope.widgetData.style.color = newColor;
                            element.addClass(scope.widgetData.style.color);
                            scope.state.colorPickerVisible = false;
                            scope.$emit('saveDashBoardData');
                        }
                    }
                }
            }
        }).directive('dashboardManage', function ($compile, $timeout) {
            return {
                restrict: 'A',
                template: '<div class="uib-dashboard-manage"/>',
                require: '^dashboard',
                link: function (scope, element, attrs, dashboardCtrl) {
                    var uibDashboardManageElement = element.children('.uib-dashboard-manage');
                    var renderWidgets = function () {
                        var defaultWidth = scope.dashboardConfig.widget_base_dimensions[0];
                        var defaultHeight = scope.dashboardConfig.widget_base_dimensions[1];
                        var margin = scope.dashboardConfig.widget_margins[0] * 2;
                        uibDashboardManageElement.empty();
                        var shownWidgets = {};
                        var presentWidgets = {};
                        for (var i = 0; i < scope.dashboardData.widgets.length; i++) {
                            presentWidgets[scope.dashboardData.widgets[i].id] = true;
                        }

                        for (var i = 0; i < scope.dashboardConfig.widgets.length; i++) {
                            var widgetConfiguration = scope.dashboardConfig.widgets[i];

                            var widgetTemplate = '<div class="dashboard-manage-widget dashboard-widget" widget-id="' + widgetConfiguration.id + '" style="height:auto;width:' + (widgetConfiguration.size.width * defaultWidth + (widgetConfiguration.size.width - 1) * margin) + 'px" data-sizex="' + widgetConfiguration.size.width + '" data-sizey="' + widgetConfiguration.size.height + '"/>';
                            var widget = $(widgetTemplate).appendTo(uibDashboardManageElement);
                            var widgetScope = scope.$new(true);
                            widgetScope.widgetData = scope.dashboardConfig.widgets[i];
                            widgetScope.present = (!!presentWidgets[widgetConfiguration.id]);
                            widgetScope.template = true;
                            widgetScope.setDataQueryState = getSetDataQueryStateFn(widgetScope);
                            widgetScope.allowMultipleAdd = widgetConfiguration.allowMultipleAdd;
                            widgetScope.fixedWidgetHeight = widgetConfiguration.size.height * defaultHeight + (widgetConfiguration.size.height - 1) * margin - 40;

                            shownWidgets[widgetConfiguration.id] = true;
                            $compile(widget)(widgetScope);
                        }
                        $timeout(function () {
                            var msnry = new Masonry(uibDashboardManageElement[0], {
                                columnWidth: defaultWidth,
                                gutter: margin,
                                itemSelector: '.dashboard-manage-widget'
                            });
                        });
                    }

                    scope.$watch('state.showDashboardManage', function (showDashboardManage) {
                        if (showDashboardManage) {
                            renderWidgets();
                        }
                    })
                }
            }
        });
})();