// Copyright 2023 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, {Component} from "react";
import {Link, Redirect, Route, Switch, withRouter} from "react-router-dom";
import {StyleProvider, legacyLogicalPropertiesTransformer} from "@ant-design/cssinjs";
import {Avatar, Button, Card, ConfigProvider, Drawer, Dropdown, FloatButton, Layout, Menu} from "antd";
import {BarsOutlined, DownOutlined, LogoutOutlined, SettingOutlined} from "@ant-design/icons";
import "./App.less";
import * as Setting from "./Setting";
import * as AccountBackend from "./backend/AccountBackend";
import AuthCallback from "./AuthCallback";
import * as Conf from "./Conf";
import HomePage from "./HomePage";
import SigninPage from "./SigninPage";
import i18next from "i18next";
import {withTranslation} from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import RecordListPage from "./RecordListPage";
import RecordEditPage from "./RecordEditPage";
import AssetListPage from "./AssetListPage";
import AssetEditPage from "./AssetEditPage";
import GuacdPage from "./component/access/GuacdPage";

const {Header, Footer, Content} = Layout;
const hiddenPages = ["/access"];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      selectedMenuKey: 0,
      account: undefined,
      uri: null,
      themeData: Conf.ThemeDefault,
      menuVisible: false,
    };

    Setting.initServerUrl();
    Setting.initCasdoorSdk(Conf.AuthConfig);
  }

  UNSAFE_componentWillMount() {
    this.updateMenuKey();
    this.getAccount();
  }

  componentDidUpdate() {
    // eslint-disable-next-line no-restricted-globals
    const uri = location.pathname;
    if (this.state.uri !== uri) {
      this.updateMenuKey();
    }
  }

  updateMenuKey() {
    // eslint-disable-next-line no-restricted-globals
    const uri = location.pathname;
    this.setState({
      uri: uri,
    });
    if (uri === "/" || uri === "/home") {
      this.setState({selectedMenuKey: "/"});
    } else if (uri.includes("/records")) {
      this.setState({selectedMenuKey: "/records"});
    } else if (uri.includes("/assets")) {
      this.setState({selectedMenuKey: "/assets"});
    } else {
      this.setState({selectedMenuKey: "null"});
    }
  }

  onUpdateAccount(account) {
    this.setState({
      account: account,
    });
  }

  setLanguage() {
    // let language = account?.language;
    const language = localStorage.getItem("language");
    if (language !== "" && language !== i18next.language) {
      Setting.setLanguage(language);
    }
  }

  getAccount() {
    AccountBackend.getAccount()
      .then((res) => {
        const account = res.data;
        if (account !== null) {
          this.setLanguage(account);
        }

        this.setState({
          account: account,
        });
      });
  }

  signout() {
    AccountBackend.signout()
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            account: null,
          });

          Setting.showMessage("success", "Successfully signed out, redirected to homepage");
          Setting.goToLink("/");
          // this.props.history.push("/");
        } else {
          Setting.showMessage("error", `Signout failed: ${res.msg}`);
        }
      });
  }

  onClose = () => {
    this.setState({
      menuVisible: false,
    });
  };

  showMenu = () => {
    this.setState({
      menuVisible: true,
    });
  };

  renderAvatar() {
    if (this.state.account.avatar === "") {
      return (
        <Avatar style={{backgroundColor: Setting.getAvatarColor(this.state.account.name), verticalAlign: "middle"}} size="large">
          {Setting.getShortName(this.state.account.name)}
        </Avatar>
      );
    } else {
      return (
        <Avatar src={this.state.account.avatar} style={{verticalAlign: "middle"}} size="large">
          {Setting.getShortName(this.state.account.name)}
        </Avatar>
      );
    }
  }

  renderRightDropdown() {
    const items = [];
    items.push(Setting.getItem(<><SettingOutlined />&nbsp;&nbsp;{i18next.t("account:My Account")}</>,
      "/account"
    ));
    items.push(Setting.getItem(<><LogoutOutlined />&nbsp;&nbsp;{i18next.t("account:Sign Out")}</>,
      "/logout"
    ));
    const onClick = (e) => {
      if (e.key === "/account") {
        Setting.openLink(Setting.getMyProfileUrl(this.state.account));
      } else if (e.key === "/logout") {
        this.signout();
      }
    };

    return (
      <Dropdown key="/rightDropDown" menu={{items, onClick}} >
        <div className="rightDropDown">
          {
            this.renderAvatar()
          }
          &nbsp;
          &nbsp;
          {Setting.isMobile() ? null : Setting.getShortName(this.state.account.displayName)} &nbsp; <DownOutlined />
          &nbsp;
          &nbsp;
          &nbsp;
        </div>
      </Dropdown>
    );
  }

  renderAccountMenu() {
    if (this.state.account === undefined) {
      return null;
    } else if (this.state.account === null) {
      return (
        <React.Fragment>
          <Menu.Item key="/signup" style={{float: "right", marginRight: "20px"}}>
            <a href={Setting.getSignupUrl()}>
              {i18next.t("account:Sign Up")}
            </a>
          </Menu.Item>
          <Menu.Item key="/signin" style={{float: "right"}}>
            <a href={Setting.getSigninUrl()}>
              {i18next.t("account:Sign In")}
            </a>
          </Menu.Item>
          <Menu.Item style={{float: "right", margin: "0px", padding: "0px"}}>
            <LanguageSelect />
          </Menu.Item>
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          {this.renderRightDropdown()}
          <LanguageSelect />
        </React.Fragment>
      );
    }
  }

  getMenuItems() {
    const res = [];

    if (this.state.account === null || this.state.account === undefined) {
      return [];
    }

    res.push(Setting.getItem(<Link to="/">{i18next.t("general:Home")}</Link>, "/"));

    res.push(Setting.getItem(<Link to="/records">{i18next.t("general:Records")}</Link>,
      "/records"));

    res.push(Setting.getItem(<Link to="/assets">{i18next.t("general:Assets")}</Link>,
      "/assets"));

    // if (Setting.isLocalAdminUser(this.state.account)) {
    //
    //   res.push(Setting.getItem(
    //     <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.state.account).replace("/account", "/records")}>
    //       {i18next.t("general:Logs")}
    //       {Setting.renderExternalLink()}
    //     </a>,
    //     "###"));
    // }

    return res;
  }

  renderHomeIfSignedIn(component) {
    if (this.state.account !== null && this.state.account !== undefined) {
      return <Redirect to="/" />;
    } else {
      return component;
    }
  }

  renderSigninIfNotSignedIn(component) {
    if (this.state.account === null) {
      sessionStorage.setItem("from", window.location.pathname);
      window.location.replace(Setting.getSigninUrl());
    } else if (this.state.account === undefined) {
      return null;
    } else {
      return component;
    }
  }

  renderRouter() {
    return (
      <Switch>
        <Route exact path="/callback" component={AuthCallback} />
        <Route exact path="/signin" render={(props) => this.renderHomeIfSignedIn(<SigninPage {...props} />)} />
        <Route exact path="/" render={(props) => this.renderSigninIfNotSignedIn(<HomePage account={this.state.account} {...props} />)} />
        <Route exact path="/home" render={(props) => this.renderSigninIfNotSignedIn(<HomePage account={this.state.account} {...props} />)} />
        <Route exact path="/records" render={(props) => this.renderSigninIfNotSignedIn(<RecordListPage account={this.state.account} {...props} />)} />
        <Route exact path="/records/:organizationName/:recordName" render={(props) => this.renderSigninIfNotSignedIn(<RecordEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/assets" render={(props) => this.renderSigninIfNotSignedIn(<AssetListPage account={this.state.account} {...props} />)} />
        <Route exact path="/assets/:organizationName/:assetName" render={(props) => this.renderSigninIfNotSignedIn(<AssetEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/access" render={(props) => this.renderSigninIfNotSignedIn(<GuacdPage account={this.state.account} {...props} />)} />
      </Switch>
    );
  }

  isWithoutCard() {
    return Setting.isMobile() || window.location.pathname === "/chat";
  }

  renderContent() {
    const onClick = ({key}) => {
      // eslint-disable-next-line react/prop-types
      this.props.history.push(key);
    };
    const menuStyleRight = Setting.isAdminUser(this.state.account) && !Setting.isMobile() ? "calc(180px + 260px)" : "260px";
    const currentPath = window.location.pathname;
    const isHiddenPage = hiddenPages.includes(currentPath);

    return (
      <Layout id="parent-area">
        {!isHiddenPage && (
          <Header style={{padding: "0", marginBottom: "3px", backgroundColor: "white"}}>
            {Setting.isMobile() ? null : (
              <Link to={"/"}>
                <div className="logo" />
              </Link>
            )}
            {Setting.isMobile() ? (
              <React.Fragment>
                <Drawer title={i18next.t("general:Close")} placement="left" visible={this.state.menuVisible} onClose={this.onClose}>
                  <Menu
                    items={this.getMenuItems()}
                    mode={"inline"}
                    selectedKeys={[this.state.selectedMenuKey]}
                    style={{lineHeight: "64px"}}
                    onClick={this.onClose}
                  >
                  </Menu>
                </Drawer>
                <Button icon={<BarsOutlined />} onClick={this.showMenu} type="text">
                  {i18next.t("general:Menu")}
                </Button>
              </React.Fragment>
            ) : (
              <Menu
                onClick={onClick}
                items={this.getMenuItems()}
                mode={"horizontal"}
                selectedKeys={[this.state.selectedMenuKey]}
                style={{position: "absolute", left: "145px", right: menuStyleRight}}
              />
            )}
            {this.renderAccountMenu()}
          </Header>
        )}

        <Content style={{display: "flex", flexDirection: "column"}}>
          {this.isWithoutCard() || isHiddenPage ? this.renderRouter() : <Card className="content-warp-card">{this.renderRouter()}</Card>}
        </Content>

        {!isHiddenPage && this.renderFooter()}
      </Layout>
    );
  }

  renderFooter() {
    // How to keep your footer where it belongs ?
    // https://www.freecodecamp.org/news/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/

    return (
      <React.Fragment>
        <Footer id="footer" style={
          {
            borderTop: "1px solid #e8e8e8",
            backgroundColor: "#f5f5f5",
            textAlign: "center",
          }
        }>
          Powered by <a style={{fontWeight: "bold", color: "black"}} target="_blank" rel="noreferrer" href="https://github.com/casbin/casvisor">Casvisor</a>
        </Footer>
      </React.Fragment>
    );
  }

  renderPage() {
    return (
      <React.Fragment>
        {/* { */}
        {/*   this.renderBanner() */}
        {/* } */}
        <FloatButton.BackTop />
        {/* <CustomGithubCorner />*/}
        {
          this.renderContent()
        }
      </React.Fragment>
    );
  }

  render() {
    return (
      <React.Fragment>
        <ConfigProvider theme={{
          token: {
            colorPrimary: this.state.themeData.colorPrimary,
            colorInfo: this.state.themeData.colorPrimary,
            borderRadius: this.state.themeData.borderRadius,
          },
          // algorithm: Setting.getAlgorithm(this.state.themeAlgorithm),
        }}>
          <StyleProvider hashPriority="high" transformers={[legacyLogicalPropertiesTransformer]}>
            {
              this.renderPage()
            }
          </StyleProvider>
        </ConfigProvider>
      </React.Fragment>
    );
  }
}

export default withRouter(withTranslation()(App));
