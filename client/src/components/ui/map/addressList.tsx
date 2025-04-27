import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Address {
  _id: string;
  name: string;
  address_line1: string;
  city: string;
  is_default: boolean;
}

interface AddressListProps {
  userId: string;
}

const AddressList: React.FC<AddressListProps> = ({ userId }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/addresses`);
        setAddresses(response.data.result);
      } catch (error) {
        console.error('Không thể tải danh sách địa chỉ', error);
      }
    };

    fetchAddresses();
  }, [userId]);

  const deleteAddress = async (addressId: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/addresses/${addressId}`);
      setAddresses(addresses.filter(address => address._id !== addressId));
      toast.success('Địa chỉ đã được xoá!');
    } catch (error) {
      toast.error('Không thể xoá địa chỉ!');
    }
  };

  return (
    <div>
      <h3>Danh sách địa chỉ</h3>
      <ul>
        {addresses.map((address) => (
          <li key={address._id}>
            <p>{address.name}</p>
            <p>{address.address_line1}, {address.city}</p>
            <p>{address.is_default ? 'Mặc định' : 'Không mặc định'}</p>
            <button onClick={() => deleteAddress(address._id)}>Xoá</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddressList;
