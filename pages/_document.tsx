import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import config from "../config/config";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
            <script src={`https://www.google.com/recaptcha/api.js?render=${config.recaptcha_site_key}`}></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
