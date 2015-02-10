<%@include file="/libs/foundation/global.jsp" %><%
%><%@ page session="false" %><%
%>
<div ng-controller="LoginController" class="list">
	<label class="item item-input item-stacked-label">
		<input type="text" ng-model="username" placeholder="username">
	</label>
	<label class="item item-input item-stacked-label">
		<input type="password" ng-model="password" placeholder="password">
	</label>
	<button class="topcoat-button--cta" ng-click="login()">Login</button>
</div>
