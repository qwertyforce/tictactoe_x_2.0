import Head from 'next/head'
import styles from '../styles/Home.module.css'
import NavBar from '../components/NavBar'
export default function Home(props) {
  return (
    <div>
     <NavBar authed={props.authed}/>
    </div>
  )
}
export async function getServerSideProps(context) {
  return {
      props: {
          authed: true
      }
  }
}
