<%@page session="false"
	    import="com.day.cq.wcm.api.WCMMode,
	            com.adobe.cq.mobile.angular.data.util.FrameworkContentExporterUtils" %><%
%><%@include file="/libs/foundation/global.jsp" %><%
%>
<div class="list">

    <a class="item item-button-right" ng-click="go('/content/phonegap/app_name_placeholder/en/home/login')">
        Login
        <button class="button button-positive">
            <i class="icon ion-ios-gear"></i>
        </button>
    </a>
    <a class="item item-button-right" ng-click="updateApp()">
        Update
        <button class="button button-positive">
            <i class="icon ion-ios7-cloud-download"></i>
        </button>
    </a>

</div>
