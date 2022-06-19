import React, { useEffect, useState } from "react";
import "./Partnership.scss";
import PhoneInput from "react-phone-input-2";
import TextField from "@mui/material/TextField";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Typography from "@mui/material/Typography";
import "react-phone-input-2/lib/material.css";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Link, useNavigate, useParams } from "react-router-dom";
import SaveIcon from "@mui/icons-material/Save";
import Files from "react-files";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Fab,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  AddLinkOutlined,
  Copyright,
  Upload,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import DateAdapter from "@mui/lab/AdapterDateFns";
import { DatePicker, LocalizationProvider } from "@mui/lab";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import { usePlacesWidget } from "react-google-autocomplete";
import { styled } from "@mui/material/styles";

import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Stack from "@mui/material/Stack";
import FileUpload from "react-material-file-upload";
import UploadFiles from "./UploadFiles";
import axios from "axios";
import { useCookies } from "react-cookie";
import useAxiosPrivate from "../../../hooks/useAxiosPrivate";
import AutoFillForm from "../../Address/AutoFillForm";
import { getMonthsWithData, getMonthsWithDataAdd } from "./SelfEmployment";
import { getQueryStringParam } from "./Employment";
import moment from "moment";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
const getMonths = (fromDate, toDate) => {
  const fromYear = fromDate.getFullYear();
  const fromMonth = fromDate.getMonth();
  const toYear = toDate.getFullYear();
  const toMonth = toDate.getMonth();
  const months = [];
  for (let year = fromYear; year <= toYear; year++) {
    let month = year === fromYear ? fromMonth : 0;
    const monthLimit = year === toYear ? toMonth : 11;
    for (; month <= monthLimit; month++) {
      months.push({ year, month, amount: "" });
    }
  }
  return months;
};
const mL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const mS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

const Input = styled("input")({
  display: "none",
});

const Partnership = () => {
  let navigate = useNavigate();

  const [overallexpenses, setOverallexpenses] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [monthsList, setMonthsList] = React.useState([]);
  const axiosPrivate = useAxiosPrivate();
  const [expenseListHide, setExpenseListHide] = React.useState(false);
  const [expensesList, setExpensesList] = React.useState([
    {
      description: "",
      amount: 0,
    },
  ]);
  const [partnershipList, setPartnershipList] = React.useState([
    {
      fullName: "",
      share: "",
    },
  ]);
  const [netProfit, setNetProfit] = React.useState("");
  const params = useParams();
  const [overallexpenseValue, setOverallexpensesValue] = React.useState("");
  const [totalTurnover, setTotalTurnover] = React.useState("");

  const [cookies, setCookie] = useCookies();
  const [urls, setUrls] = useState([]);
  const [isLoading, setLoading] = React.useState(false);
  const { ref, autocompleteRef } = usePlacesWidget({
    apiKey: "YOUR_GOOGLE_MAPS_API_KEY",
    onPlaceSelected: (place) => {
      //console.log(place);
    },
  });

  const validationSchema = Yup.object().shape({
    partnershipName: Yup.string().required(
      "Partnership name must not be empty."
    ),
    descriptionOfBusiness: Yup.string().required(
      "Description of your business must not be empty."
    ),
    address: Yup.string().required("Business address must not be empty."),
    totalTurnover: Yup.string().required("Total turnover must not be empty"),
  });

  const formOptions = {
    mode: "onChange",
    resolver: yupResolver(validationSchema),
    defaultValues: {
      partnershipName: "",
      descriptionOfBusiness: "",
      address: "",
      totalTurnover: "",
    },
  };

  const {
    register,
    handleSubmit,
    formState,
    reset,
    setValue,
    trigger,
    getValues,
  } = useForm(formOptions);
  const { errors } = formState;

  const packageId = getQueryStringParam("packageId");

  const postCall = (data) => {
    const response = axiosPrivate.post(
      "https://tax.api.cyberozunu.com/api/v1.1/Partnership",
      {
        orderId: params.orderId ? params.orderId : cookies.order.oderId,
        name: data.partnershipName,
        descriptionOfBusiness: data.descriptionOfBusiness,
        address: JSON.stringify(address ?? {}),
        postalCode: data.postalCode,
        accountingPeriodFrom: startDate,
        accountPeriodTo: endDate,
        shares: [
          ...partnershipList.map((n) => {
            return { name: n.fullName, percentage: parseInt(n.share) };
          }),
        ],
        totalTurnOver: data.totalTurnover ? parseInt(data.totalTurnover) : 0,
        turnOver: [
          ...monthsList.map((n) => {
            return { month: mL[n.month], amount: parseInt(n.amount) };
          }),
        ],
        totalExpenses: overallexpenseValue ? parseInt(overallexpenseValue) : 0,
        expenses:
          expensesList.length === 0
            ? []
            : expensesList.length === 1 && expensesList[0].amount === 0
            ? []
            : [
                ...expensesList.map((n) => {
                  return {
                    description: n.description,
                    amount: parseInt(n.amount),
                  };
                }),
              ],
        attachments: [
          ...urls.map((n) => {
            return { url: n };
          }),
        ],
      }
    );

    return response;
  };

  const putCall = (data) => {
    const response = axiosPrivate.put(
      "https://tax.api.cyberozunu.com/api/v1.1/Partnership",
      {
        id: packageId,
        orderId: params.orderId,
        name: data.partnershipName,
        descriptionOfBusiness: data.descriptionOfBusiness,
        address: JSON.stringify(address ?? {}),
        postalCode: data.postalCode,
        accountingPeriodFrom: startDate,
        accountPeriodTo: endDate,
        totalTurnOver: data.totalTurnover ? parseInt(data.totalTurnover) : 0,
        shares: [
          ...partnershipList.map((n) => {
            return { id: n.id, name: n.fullName, percentage: parseInt(n.share) };
          }),
        ],
        turnOver: [
          ...monthsList.map((n) => {
            return { id: n.id, month: mL[n.month], amount: parseInt(n.amount) };
          }),
        ],
        totalExpenses: overallexpenseValue ? parseInt(overallexpenseValue) : 0,
        expenses:
          expensesList.length === 0
            ? []
            : expensesList.length === 1 && expensesList[0].amount === 0
            ? []
            : [
                ...expensesList.map((n) => {
                  return {
                    id: n.id,
                    description: n.description,
                    amount: parseInt(n.amount),
                  };
                }),
              ],
        attachments: [
          ...urls.map((n) => {
            return { id: n.id, url: n.url };
          }),
        ],
      }
    );

    return response;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = packageId ? await putCall(data) : await postCall(data);
      setLoading(false);
      reset();
      setExpensesList([{ description: "", amount: "" }]);
      setPartnershipList([{ fullName: "", share: "" }]);
      setNetProfit("");
      setAddress("");
      setLoading(false);
      toast.success(
        packageId
          ? "Partnership Details Edit Successfully"
          : "Partnership Details Saved Successfully"
      );
      setUrls([]);
      setOverallexpensesValue("");
      setTotalTurnover("");
      if (packageId) {
        navigate("/");
      } else {
        if (params.orderId) {
          navigate("/");
        } else {
          if (cookies.order.selectedPackages.length > 1) {
            const filteredEmployement = cookies.order.selectedPackages.filter(
              (n) => n.package.name === "Partnership"
            );

            filteredEmployement[0].package.recordsAdded = true;

            const filteredOther = cookies.order.selectedPackages.filter(
              (n) => n.package.name !== "Partnership"
            );
            const filtered = filteredOther.filter(
              (n) => n.package.recordsAdded !== true
            );

            setCookie(
              "order",
              {
                oderId: cookies.order.oderId,
                selectedPackages: [...filteredOther, ...filteredEmployement ],
              },
              {
                path: "/",
              }
            );

            if (filtered.length > 0) {
              navigate(
                `/${filtered[0].package.name.toLowerCase().replace(/\s/g, "")}`
              );
            } else {
              navigate("/");
            }
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setLoading(false);
      toast.error(err);
    }
  };

  const onSubmitAndAddAnother = async (data) => {
    setLoading(true);

    try {
      const response = await postCall(data);
      reset();
      setExpensesList([{ description: "", amount: "" }]);
      setLoading(false);
      toast.success("Partnership Details Saved Successfully");
      setUrls([]);
      setAddress("");
      setOverallexpensesValue("");
      setPartnershipList([{ fullName: "", share: "" }]);
      setNetProfit("");
      setTotalTurnover("");
    } catch (err) {
      setLoading(false);
      toast.error(err);
    }
  };

  const handleInputMonth = (i, event) => {
    const values = [...monthsList];
    const { name, value } = event.target;
    values[i]["amount"] = value;
    setMonthsList(values);
    if (value) {
      setTotalTurnover(
        values.reduce((acc, curr) => acc + parseInt(curr.amount), 0)
      );
      setValue(
        "totalTurnover",
        values.reduce((acc, curr) => acc + parseInt(curr.amount), 0)
      );
    }
  };
  
  function handleChangeInput(i, event) {
    const values = [...expensesList];
    const { name, value } = event.target;
    values[i][name] = value;
    setExpensesList(values);
    if (value) {
      setOverallexpenses(true);
      setOverallexpensesValue(
        values.reduce((acc, curr) => acc + parseInt(curr.amount), 0)
      );
      setNetProfit(
        parseInt(totalTurnover) -
          parseInt(values.reduce((acc, curr) => acc + parseInt(curr.amount), 0))
      );
    } else {
      setOverallexpenses(false);
    }
  }

  function handleChangeInputPartnership(i, event) {
    const values = [...partnershipList];
    const { name, value } = event.target;
    values[i][name] = value;
    setPartnershipList(values);
  }

  function handleAddInput() {
    const values = [...expensesList];
    values.push({
      description: "",
      amount: 0,
    });
    setExpensesList(values);
    setOverallexpensesValue(
      expensesList.reduce((acc, curr) => acc + parseInt(curr.amount), 0)
    );
  }

  function handleAddInputPartnerShip() {
    const values = [...partnershipList];
    values.push({
      fullName: "",
      share: "",
    });
    setPartnershipList(values);
  }

  function handleRemoveInput(i) {
    const values = [...expensesList];
    values.splice(i, 1);
    setExpensesList(values);
    setOverallexpensesValue(
      values.reduce((acc, curr) => acc + parseInt(curr.amount), 0)
    );
  }

  function handleRemoveInputPartnership(i) {
    const values = [...partnershipList];
    values.splice(i, 1);
    setPartnershipList(values);
  }

  const handleOverallExpenses = (e) => {
    setOverallexpensesValue(e.target.value);

    if (e.target.value) {
      setExpenseListHide(true);
      setNetProfit(parseInt(totalTurnover) - parseInt(e.target.value));
    } else {
      setExpenseListHide(false);
    }
  };

  const handleStartDate = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDate = (e) => {
    setEndDate(e.target.value);
    if (packageId) {
      setMonthsList(
        getMonthsWithDataAdd(
          new Date(startDate),
          new Date(e.target.value),
          monthsList
        )
      );
    } else {
      setMonthsList(getMonths(new Date(startDate), new Date(e.target.value)));
    }
  };


  const handleUpload = (urlsComming) => {
    if (packageId) {
      setUrls([
        ...urls,
        ...urlsComming.map((n) => {
          return { url: n };
        }),
      ]);
    } else {
      setUrls(urlsComming);
    }
  };

  const handleAddress = (value) => {
    setAddress(value);
    setValue("address", JSON.stringify(value));
  };

  const handleTotalTurnover = (e) => {
    setValue("totalTurnover", e.target.value);
    setTotalTurnover(e.target.value);
  };

  const handleCalculateProfit = (share) => {
    const profit = netProfit * (share / 100);
    return profit;
  };

  useEffect(() => {
    if (packageId) {
      // get user and set form fields
      getPackage(packageId);
    }
  }, [packageId]);

  const getPackage = async (packageId) => {
    setLoading(true);
    try {
      const response = await axiosPrivate.get(
        `https://tax.api.cyberozunu.com/api/v1.1/Partnership/${packageId}`
      );
      const fields = [
        "partnershipName",
        "descriptionOfBusiness",
        "address",
        "totalTurnover",
      ];

      const packages = {
        partnershipName: response.data.result.name,
        descriptionOfBusiness: response.data.result.descriptionOfBusiness,
        address: response.data.result.address,
        totalTurnover: response.data.result.totalTurnOver,
      };
      
      setTotalTurnover(response.data.result.totalTurnOver);
      fields.forEach((field) => setValue(field, packages[field]));
      setAddress(JSON.parse(response.data.result.address));
      if (response.data.result.expenses.length > 0) {
        setExpensesList([
          ...response.data.result.expenses.map((n) => {
            return { id: n.id, description: n.description, amount: n.amount };
          }),
        ]);
      } else {
        setExpensesList([{ description: "", amount: 0 }]);
      }

      setStartDate(
        moment(response.data.result.accountingPeriodFrom).format("YYYY-MM-DD")
      );
      setEndDate(
        moment(response.data.result.accountPeriodTo).format("YYYY-MM-DD")
      );
      if(response.data.result.turnOver.length>0){
        setMonthsList(
          getMonthsWithData(
            new Date(response.data.result.accountingPeriodFrom),
            new Date(response.data.result.accountPeriodTo),
            response.data.result.turnOver
          )
        );
      }
      

      if (response.data.result?.attachments?.length > 0) {
        setUrls([
          ...response.data.result.attachments.map((n) => {
            return { url: n.url, id: n.id };
          }),
        ]);
      }

      setOverallexpensesValue(response.data.result.totalExpenses);
      setPartnershipList(response.data.result.shares.map(n=>{return {id:n.id,fullName: n.name, share: n.percentage}}));
      
      if(response.data.result.totalExpenses && response.data.result.totalTurnOver){
        setNetProfit(response.data.result.totalTurnOver - response.data.result.totalExpenses);
      }else if(response.data.result.totalTurnOver){

        setNetProfit(parseInt(response.data.result.totalTurnOver.toString()));
      }

      
      
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
    setLoading(false);
  };

  return (
    <div className="Partnership">
      {isLoading ? (
        <CircularProgress />
      ) : (
        <form>
          <ToastContainer />
          <Container component="main" maxWidth="lg">
          <div className="back-button" onClick={() => navigate(-1)}>
            <ArrowBackIosNewIcon className="back-icon" />
            <h5 className="title is-5">Back</h5>
          </div>
            <Box
              sx={{
                // marginTop: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                <LockOutlinedIcon />
              </Avatar> */}
              {/* <Typography component="h1" variant="h5">
                Sign up
              </Typography> */}
              <p className="title is-3">Partnership</p>
              <Box sx={{ mt: 1 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={12}>
                    <InputLabel
                      htmlFor="partnershipName"
                      required
                      sx={{ fontWeight: "bold" }}
                    >
                      Partnership Name
                    </InputLabel>
                    <TextField
                      name="partnershipName"
                      required
                      fullWidth
                      id="partnershipName"
                      placeholder="Enter your partnership name"
                      autoFocus
                      error={errors.partnershipName?.message}
                      {...register("partnershipName")}
                    />

                    <Typography variant="body2" color="error" align="left">
                      {errors.partnershipName?.message}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InputLabel
                      htmlFor="descriptionOfBusiness"
                      required
                      sx={{ fontWeight: "bold" }}
                    >
                      Nature of business
                    </InputLabel>
                    <TextField
                      required
                      fullWidth
                      id="descriptionOfBusiness"
                      name="descriptionOfBusiness"
                      {...register("descriptionOfBusiness")}
                      placeholder="Describe your nature of business"
                    />
                    <Typography variant="body2" color="error" align="left">
                      {errors.descriptionOfBusiness?.message}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputLabel
                      htmlFor="address"
                      required
                      sx={{ fontWeight: "bold" }}
                    >
                      Address
                    </InputLabel>
                    {/* <TextField
                    required
                    fullWidth
                    multiline
                    maxRows={4}
                    id="address"
                    name="address"
                    {...register("address")}
                    placeholder="Enter your business address"
                  /> */}
                   <AutoFillForm
                      handleAddress={handleAddress}
                      addressComingFrom={address}
                    />
                    <Typography variant="body2" color="error" align="left">
                      {errors.address?.message}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <InputLabel htmlFor="payee" sx={{ fontWeight: "600" }}>
                      Partnership Details
                    </InputLabel>
                  </Grid>

                  {partnershipList.map((field, idx) => (
                    <React.Fragment key={field + "-" + idx}>
                      <Grid item xs={12} sm={5.5}>
                        <InputLabel htmlFor="payee" required>
                          Full Name
                        </InputLabel>
                        <TextField
                          required
                          fullWidth
                          id="fullName"
                          name="fullName"
                          value={field.fullName}
                          // {...register("description")}
                          onChange={(e) => handleChangeInputPartnership(idx, e)}
                          placeholder="Full Name"
                        />
                      </Grid>
                      <Grid item xs={12} sm={5.5}>
                        <InputLabel htmlFor="payee" required>
                          Share of profit (%)
                        </InputLabel>
                        <TextField
                          required
                          fullWidth
                          id="share"
                          name="share"
                          value={field.share}
                          type="share"
                          onChange={(e) => handleChangeInputPartnership(idx, e)}
                          placeholder="Share of profit (%)"
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        
                      </Grid>
                    </React.Fragment>
                  ))}
                  <Grid item xs={12} sm={12}>
                    <InputLabel htmlFor="payee" sx={{ fontWeight: "600" }}>
                      Accounting period
                    </InputLabel>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <InputLabel
                      htmlFor="startDate"
                      required
                      sx={{ fontWeight: "bold" }}
                    >
                      Date your books or accounts start
                    </InputLabel>
                    <TextField
                      required
                      fullWidth
                      id="startDate"
                      name="startDate"
                      type={"date"}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      value={startDate}
                      onChange={handleStartDate}
                      placeholder="Enter your business address"
                    />
                    <Typography variant="body2" color="error" align="left">
                      {errors.startDate?.message}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputLabel
                      htmlFor="endDate"
                      required
                      sx={{ fontWeight: "bold" }}
                    >
                      Date your books or accounts end
                    </InputLabel>
                    <TextField
                      required
                      fullWidth
                      id="endDate"
                      name="endDate"
                      type={"date"}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      value={endDate}
                      onChange={handleEndDate}
                      placeholder="Enter your business address"
                    />
                    <Typography variant="body2" color="error" align="left">
                      {errors.endDate?.message}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <InputLabel
                      htmlFor="totalTurnover"
                      required
                      sx={{ fontWeight: "bold" }}
                    >
                      Total turnover
                    </InputLabel>
                    <TextField
                      required
                      fullWidth
                      id="totalTurnover"
                      name="totalTurnover"
                      type={"number"}
                      value={totalTurnover}
                      // {...register("totalTurnover")}
                      onChange={handleTotalTurnover}
                      placeholder="Enter your Total turnover"
                    />
                    <Typography variant="body2" color="error" align="left">
                      {errors.totalTurnover?.message}
                    </Typography>
                  </Grid>
                  {monthsList.map((n, i) => (
                    <React.Fragment key={n.month + "-" + n.year}>
                      <Grid
                        item
                        xs={12}
                        sm={2}
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "flex-start",
                        }}
                      >
                        <InputLabel
                          htmlFor="payee"
                          required
                          sx={{
                            fontWeight: "bold",
                            alignSelf: "flex-end",
                            justifySelf: "flex-end",
                          }}
                        >
                          {mL[n.month]}
                        </InputLabel>
                      </Grid>
                      <Grid item xs={12} sm={10}>
                        <TextField
                          required
                          fullWidth
                          id="monthExpense"
                          name="monthExpense"
                          type={"number"}
                          onChange={(e) => handleInputMonth(i, e)}
                          placeholder="Enter your expense"
                          value={n.amount}
                        />
                        <Typography variant="body2" color="error" align="left">
                          {errors.taxFrom?.message}
                        </Typography>
                      </Grid>
                    </React.Fragment>
                  ))}

                  <Grid item xs={12} sm={12}>
                    <InputLabel htmlFor="payee" sx={{ fontWeight: "600" }}>
                      Expenses
                    </InputLabel>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <InputLabel
                      htmlFor="payee"
                      // required
                      // sx={{ fontWeight: "bold" }}
                    >
                      Overall expenses
                    </InputLabel>
                    <TextField
                      fullWidth
                      id="overallExpenses"
                      name="overallExpenses"
                      type={"number"}
                      value={overallexpenseValue}
                      onChange={handleOverallExpenses}
                      placeholder="Enter your overall expenses"
                      disabled={overallexpenses}
                    />
                    <Typography variant="body2" color="error" align="left">
                      {errors.taxFrom?.message}
                    </Typography>
                  </Grid>
                  {expensesList.map((field, idx) => (
                    <React.Fragment key={field + "-" + idx}>
                      <Grid item xs={12} sm={5.5}>
                        <InputLabel htmlFor="payee" required>
                          Description
                        </InputLabel>
                        <TextField
                          required
                          fullWidth
                          id="description"
                          name="description"
                          value={field.description}
                          // {...register("description")}
                          onChange={(e) => handleChangeInput(idx, e)}
                          placeholder="Description"
                          disabled={expenseListHide}
                        />
                        <Typography variant="body2" color="error" align="left">
                          {errors.lastName?.message}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={5.5}>
                        <InputLabel htmlFor="payee" required>
                          Amount
                        </InputLabel>
                        <TextField
                          required
                          fullWidth
                          id="amount"
                          name="amount"
                          value={field.amount}
                          type="number"
                          // {...register("description")}
                          onChange={(e) => handleChangeInput(idx, e)}
                          // {...register("amount")}
                          placeholder="Amount"
                          disabled={expenseListHide}
                        />
                        <Typography variant="body2" color="error" align="left">
                          {errors.lastName?.message}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        
                      </Grid>
                    </React.Fragment>
                  ))}
                  <Grid item xs={12} sm={12}>
                    <InputLabel
                      htmlFor="payee"
                      // required
                      sx={{ fontWeight: "bold" }}
                    >
                      Net Profit
                    </InputLabel>
                    <TextField
                      fullWidth
                      id="netProfit"
                      name="netProfit"
                      type={"number"}
                      value={netProfit}
                      placeholder="Net Profit"
                      disabled={true}
                    />
                  </Grid>
                  {partnershipList.map((field, idx) => (
                    <React.Fragment key={field + "-" + idx}>
                      <Grid item xs={12} sm={6}>
                        <InputLabel htmlFor="payee">Partner</InputLabel>
                        <TextField
                          required
                          fullWidth
                          id="fullName"
                          name="fullName"
                          value={field.fullName}
                          placeholder="Full Name"
                          disabled={true}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InputLabel htmlFor="payee">Profit</InputLabel>
                        <TextField
                          required
                          fullWidth
                          id="share"
                          name="share"
                          value={handleCalculateProfit(field.share)}
                          type="share"
                          placeholder="Share of profit (%)"
                          disabled={true}
                        />
                      </Grid>
                    </React.Fragment>
                  ))}
                  <Grid item xs={12} sm={12}>
                   
                    {packageId && (
                      <>
                        <ol style={{ padding: "1rem" }}>
                          {urls.map((n) => (
                            <li key={n.id}>
                              <a target={"_blank"} href={n.url}>
                                {n.url}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Container>

          
        </form>
      )}
    </div>
  );
};

export default Partnership;
