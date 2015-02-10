;(function (angular, document, undefined) {

    'use strict';

    angular.module('aemBasicLogin', [])

        .constant('basic-login.config', {
            'serverURL': 'http://localhost:4502',
            'loginPath': '/j_security_check',
            'logoutPath': '/system/sling/logout',
            'currentProfilePath': '/services/mobile/getCurrentUser',
            'configFileName': 'pge-content-packages.json'
        })

        .factory('formDataObject', function() {
            return function(data) {
                var fd = new FormData();
                angular.forEach(data, function(value, key) {
                    fd.append(key, value);
                });
                return fd;
            };
        })

        .factory('userProfile', ['$rootScope', '$q', '$http', 'basic-login.config',
            function($rootScope, $q, $http, config) {
                function fetchCurrent() {
                    var deferred = $q.defer();
                    var user = $rootScope.currentUser;

                    $http.get(config.serverURL + config.currentProfilePath, {
                        headers: {
                            Authorization: user.getBasicAuth()
                        }
                    }).then(
                        function success(data) {
                            deferred.resolve(data);
                        },
                        function error(message) {
                            deferred.reject(message);
                        }
                    );

                    return deferred.promise;
                }

                return {
                    fetchCurrent: fetchCurrent
                }
            }
        ])

        .factory('userAuthentication', ['$rootScope', '$q', '$http', 'basic-login.config', 'formDataObject', 'userProfile',
            function($rootScope, $q, $http, config, formDataObject, userProfile) {

                /**
                 * Attempt to log in with the given credentials.
                 */
                var login = function(username, password) {

                    var deferred = $q.defer();

                    // create a new User object that we will try to authenticate with.  If there is a current user for some reason,
                    // we don't want to overwrite the current user until we've logged into a new one successfully.
                    var user = new CQ.mobile.User();
                    user.setUsername(username);
                    user.setPassword(password);

                    var formData = {
                        _charset_: 'UTF-8',
                        selectedAuthType: 'form',
                        resource: '/',
                        j_validate: 'true',
                        j_username: user.getUsername(),
                        j_password: user.getPassword()
                    };

                    $http({
                        method: 'POST',
                        url: config.serverURL + config.loginPath,
                        data: formData,
                        headers: {
                            'Content-Type': undefined
                        },
                        transformRequest: formDataObject
                    })
                        .success(function(data, status) {
                            if(status == 200) {
                                console.log('Login SUCCESS for user [' + user.getUsername() + ']');
                                user.save();
                                $rootScope.currentUser = user;

                                userProfile.fetchCurrent().then(
                                    function success(data) {
                                        // Callback with the authenticated username
                                        deferred.resolve(data);
                                    },
                                    function error(message) {
                                        deferred.reject('User logged in successfully, but unable to load profile: ' + message);
                                    }
                                );
                            } else {
                                console.warn('Login failed', status, data);
                                deferred.reject('Login status: [' + status + ']');
                            }
                        })
                        .error(function(data, status) {
                            var message = 'Login failed. Status: [' + status + '], Message: [' + data + '].';

                            console.warn(message);

                            // login failed, clear, but don't remove $rootScope.currentUser, we may have an existing session
                            // and we don't want to replace that.
                            user.clear();

                            deferred.reject(message);
                        });

                    return deferred.promise;
                };

                var logout = function() {
                    var deferred = $q.defer();
                    var user = $rootScope.currentUser;

                    $http.get(config.serverURL + config.logoutPath)
                        .success(function() {
                            user.forget();
                            $rootScope.currentUser = undefined;

                            console.log('Logout success');

                            deferred.resolve();
                        })
                        .error(function(data, status) {
                            var message = 'Logout failed. Status: [' + status + '], Message: [' + data + '].';
                            console.error(message);

                            deferred.reject(message);
                        });

                    return deferred.promise;
                };

                return {
                    login: login,
                    logout: logout
                };
            }
        ])

        .controller('LoginController', ['$scope', 'userAuthentication',
            function($scope, userAuthentication) {
                $scope.username = $scope.currentUser.getUsername();
                $scope.password = "";

                $scope.login = function() {
                    userAuthentication.login($scope.username, $scope.password).then(
                        function success(data) {
                            alert('Login success!');
                            $scope.password = "";
                            console.log('basic-login LoginController login success', data)
                            // todo: time to get the user profile
                            console.log('We should fetch the user profile now');
                        },
                        function error(message) {
                            console.warn('basic-login LoginController login error', message);
                        }
                    );
                }
            }
        ])

// If there is a username stored, set a variable on $rootScope indicating
// which user is logged in.
        .run(['$rootScope', 'basic-login.config',
            function($rootScope, config) {
                var user = new CQ.mobile.User();
                user.restore();

                $rootScope.currentUser = user;

                // todo: refactor this into the contentsync library so that we don't have to load pge-content-packages.json
                var csConfigFile = CQ.mobile.contentUtils.getPathToWWWDir(window.location.href) + config.configFileName;
                CQ.mobile.contentUtils.getJSON(csConfigFile, function(error, result) {
                    // todo: remove this before feature merge
                    console.log("basic-login run: loaded pge-content-packages", error, result);

                    // use the serverURL from pge-content-packages as our endpoint, remove any trailing slashes.
                    config.serverURL = result.serverURL.replace(/\/+$/, "");
                });

            }
        ]);

}(angular, document));