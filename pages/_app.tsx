// import '../styles/globals.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { AppProps } from 'next/app';
function MyApp(props: AppProps) {
  const { Component, pageProps } = props;
  return <Component {...pageProps} />
}
export default MyApp
