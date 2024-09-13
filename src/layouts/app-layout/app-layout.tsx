import "./app-layout.css"

import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { Outlet } from "react-router-dom"

import TractianLogo from "~/assets/icons/tractian-logo.svg?react"
import { CompanyAtoms } from "~/atoms"
import type { TCompany } from "~/schemas"
import { CompanyServices } from "~/services"

export function AppLayout() {
  const [company, setCompany] = useAtom(CompanyAtoms.companyAtom)

  const companies = useQuery({
    queryFn: CompanyServices.getCompanies,
    queryKey: [CompanyServices.GetCompaniesKey],
  })

  const locations = useQuery({
    queryFn: () => CompanyServices.getCompanyLocations(company?.id as string),
    queryKey: [CompanyServices.GetCompanyLocationsKey, company?.id],
    enabled: typeof company?.id === "string",
  })

  const assets = useQuery({
    queryFn: () => CompanyServices.getCompanyAssets(company?.id as string),
    queryKey: [CompanyServices.GetCompanyAssetsKey, company?.id],
    enabled: typeof company?.id === "string",
  })

  const handleChangeCompany = (company: TCompany) => {
    setCompany(company)
  }

  return (
    <div className="app-layout">
      <header className="al-header">
        <TractianLogo className="alh-logo" />
        {/* TODO: usar skeletons, tratar casos de erro */}

        <div className="alh-menu">
          {companies.isLoading && <div>loading...</div>}
          {companies.isSuccess &&
            companies.data.map((company) => (
              <button key={company.id} onClick={() => handleChangeCompany(company)}>
                {company.name}
              </button>
            ))}
        </div>
      </header>
    </div>
  )
}
